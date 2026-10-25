import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useRouter } from 'expo-router';
import { ApiError, fetchInbox, fetchRequest, type AuthRequest } from '../lib/api';
import { notifyLocally, onNotificationTap, registerForPush } from '../lib/notifications';
import { setPending } from '../lib/pending';
import { clearWallet, loadWallet } from '../lib/wallet';

const POLL_MS = 4000;

export default function InboxWatcher() {
  const router = useRouter();
  const opened = useRef<string | null>(null);
  const notified = useRef(new Set<string>());
  const registeredFor = useRef<string | null>(null);
  const pushReady = useRef(false);

  const open = useCallback(
    (prompt: AuthRequest) => {
      if (opened.current === prompt.request_id) return;
      opened.current = prompt.request_id;
      setPending(prompt);
      router.push('/consent');
    },
    [router]
  );

  useEffect(
    () =>
      onNotificationTap((requestId) => {
        if (opened.current === requestId) return;
        fetchRequest(requestId)
          .then((request) => {
            if (request.status === 'pending') open(request);
          })
          .catch(() => undefined);
      }),
    [open]
  );

  useEffect(() => {
    let stop = false;

    const look = async () => {
      const wallet = await loadWallet();
      if (!wallet || stop) return;
      if (registeredFor.current !== wallet.token) {
        registeredFor.current = wallet.token;
        registerForPush(wallet.token).then((ready) => {
          pushReady.current = ready;
        });
      }
      try {
        const { requests } = await fetchInbox(wallet.token);
        const prompt = requests[0];
        if (!prompt || stop) return;
        if (AppState.currentState === 'active') {
          open(prompt);
        } else if (!pushReady.current && !notified.current.has(prompt.request_id)) {
          notified.current.add(prompt.request_id);
          notifyLocally(prompt);
        }
      } catch (err) {
        // A rejected credential never recovers; forget it so the phone can be paired again.
        if (err instanceof ApiError && err.status === 401) await clearWallet();
      }
    };

    look();
    const timer = setInterval(look, POLL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') look();
    });
    return () => {
      stop = true;
      clearInterval(timer);
      subscription.remove();
    };
  }, [open]);

  return null;
}
