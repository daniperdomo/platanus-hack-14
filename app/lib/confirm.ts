import * as LocalAuthentication from 'expo-local-authentication';

export async function confirmIdentity() {
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) return true;
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Confirma que eres tú',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });
  return result.success;
}
