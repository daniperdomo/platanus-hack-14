"use client";

import { useState } from "react";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Credentials from "@/components/api-request/Credentials";
import StepCompany from "@/components/api-request/StepCompany";
import StepContacts from "@/components/api-request/StepContacts";
import StepDocuments from "@/components/api-request/StepDocuments";
import StepIntegration from "@/components/api-request/StepIntegration";
import StepReview from "@/components/api-request/StepReview";
import { registerClient } from "@/lib/api";
import {
  DOCUMENTS,
  isAllowedOrigin,
  isDocumentRequired,
  isEmail,
  isHttpsUrl,
  parseDomains,
} from "@/lib/apiRequest";
import { DATA_FIELDS } from "@/lib/mockData";

const STEPS = [
  { key: "company", title: "Empresa" },
  { key: "contacts", title: "Contactos" },
  { key: "integration", title: "Integración" },
  { key: "documents", title: "Documentos" },
  { key: "declaration", title: "Revisión y envío" },
];

const INITIAL_FORM = {
  company: {
    legalName: "",
    tradeName: "",
    taxId: "",
    country: "",
    website: "",
    sector: "",
    size: "",
  },
  contacts: {
    techName: "",
    techRole: "",
    techEmail: "",
    techPhone: "",
    dpoSame: false,
    dpoName: "",
    dpoEmail: "",
  },
  integration: {
    domains: "",
    redirectUri: "",
    sensitive: false,
    fields: Object.fromEntries(
      Object.keys(DATA_FIELDS).map((field) => [field, { mode: "none", purpose: "", retention: "" }])
    ),
  },
  documents: Object.fromEntries(DOCUMENTS.map((document) => [document.key, []])),
  declaration: { signer: "", signerRole: "", sworn: false, terms: false },
};

const REQUIRED = "Este campo es obligatorio.";

function isSensitive(integration) {
  return integration.sensitive || integration.fields.documento.mode !== "none";
}

function validate(step, form) {
  const errors = {};
  const requireFields = (section, keys) =>
    keys.forEach((key) => {
      if (!String(form[section][key]).trim()) errors[key] = REQUIRED;
    });

  if (step === 0) {
    requireFields("company", ["legalName", "tradeName", "taxId", "country", "website", "sector", "size"]);
    if (form.company.website && !isHttpsUrl(form.company.website)) {
      errors.website = "Usa una URL completa con https://";
    }
  }

  if (step === 1) {
    requireFields("contacts", ["techName", "techRole", "techEmail"]);
    if (form.contacts.techEmail && !isEmail(form.contacts.techEmail)) {
      errors.techEmail = "Ingresa un correo válido.";
    }
    if (!form.contacts.dpoSame) {
      requireFields("contacts", ["dpoName", "dpoEmail"]);
      if (form.contacts.dpoEmail && !isEmail(form.contacts.dpoEmail)) {
        errors.dpoEmail = "Ingresa un correo válido.";
      }
    }
  }

  if (step === 2) {
    const domains = parseDomains(form.integration.domains);
    if (domains.length === 0) errors.domains = "Agrega al menos un dominio.";
    else if (!domains.every(isAllowedOrigin)) {
      errors.domains = "Cada dominio debe empezar con https:// (o http://localhost para pruebas).";
    }
    if (!isHttpsUrl(form.integration.redirectUri)) {
      errors.redirectUri = "Usa una URL completa con https://";
    }

    const active = Object.entries(form.integration.fields).filter(([, r]) => r.mode !== "none");
    if (active.length === 0) errors.fields = "Selecciona al menos un dato.";
    active.forEach(([field, request]) => {
      if (!request.purpose.trim()) errors[`${field}.purpose`] = "Indica para qué lo usarán.";
      if (!request.retention.trim()) errors[`${field}.retention`] = "Indica el plazo.";
    });
  }

  if (step === 3) {
    const sensitive = isSensitive(form.integration);
    DOCUMENTS.forEach((document) => {
      if (isDocumentRequired(document, sensitive) && form.documents[document.key].length === 0) {
        errors[document.key] = "Adjunta este documento para continuar.";
      }
    });
  }

  if (step === 4) {
    requireFields("declaration", ["signer", "signerRole"]);
    if (!form.declaration.sworn) errors.sworn = true;
    if (!form.declaration.terms) errors.terms = true;
  }

  return errors;
}

export default function RequestApiPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [credentials, setCredentials] = useState(null);

  function update(section, key, value) {
    setForm((current) => ({ ...current, [section]: { ...current[section], [key]: value } }));
    setErrors((current) => {
      if (!current[key]) return current;
      const { [key]: _, ...rest } = current;
      return rest;
    });
  }

  function updateField(field, key, value) {
    setForm((current) => ({
      ...current,
      integration: {
        ...current.integration,
        fields: {
          ...current.integration.fields,
          [field]: { ...current.integration.fields[field], [key]: value },
        },
      },
    }));
    setErrors((current) => {
      const { [`${field}.${key}`]: _, fields: __, ...rest } = current;
      return rest;
    });
  }

  function goTo(target) {
    setErrors({});
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function next() {
    const found = validate(step, form);
    setErrors(found);
    setSubmitError("");
    if (Object.keys(found).length > 0) return;

    if (step < STEPS.length - 1) {
      goTo(step + 1);
      return;
    }

    setSubmitting(true);
    try {
      const created = await registerClient({
        name: form.company.tradeName.trim(),
        origins: parseDomains(form.integration.domains),
        redirectUri: form.integration.redirectUri.trim(),
      });
      setCredentials({
        clientId: created.client_id,
        clientSecret: created.client_secret,
        origins: created.origins,
        issuedAt: new Date().toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" }),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <>
      <Nav />
      <main className="form-page">
        <div className="container form-page__inner">
          {credentials ? (
            <Credentials company={form.company} credentials={credentials} />
          ) : (
            <>
              <header className="form-page__header">
                <span className="section-tag">Para empresas</span>
                <h1 className="form-card__title">Solicita tu API de ZeroID</h1>
                <p className="text-muted">
                  Integra “Continuar con ZeroID” en tu sitio. Necesitamos conocer
                  tu empresa y cómo manejas los datos personales; al terminar
                  recibirás tus credenciales al instante.
                </p>
              </header>

              <ol className="stepper">
                {STEPS.map((item, index) => (
                  <li
                    key={item.key}
                    className={`stepper__item${index === step ? " is-current" : ""}${
                      index < step ? " is-done" : ""
                    }`}
                  >
                    <button
                      type="button"
                      disabled={index > step}
                      onClick={() => goTo(index)}
                    >
                      <span className="stepper__num">{index < step ? "✓" : index + 1}</span>
                      <span className="stepper__title">{item.title}</span>
                    </button>
                  </li>
                ))}
              </ol>

              <form
                className="form-card"
                noValidate
                onSubmit={(event) => {
                  event.preventDefault();
                  next();
                }}
              >
                <h2 className="form-card__step">
                  {step + 1}. {STEPS[step].title}
                </h2>

                {step === 0 && (
                  <StepCompany
                    data={form.company}
                    errors={errors}
                    onChange={(key, value) => update("company", key, value)}
                  />
                )}
                {step === 1 && (
                  <StepContacts
                    data={form.contacts}
                    errors={errors}
                    onChange={(key, value) => update("contacts", key, value)}
                  />
                )}
                {step === 2 && (
                  <StepIntegration
                    data={form.integration}
                    errors={errors}
                    onChange={(key, value) => update("integration", key, value)}
                    onFieldChange={updateField}
                  />
                )}
                {step === 3 && (
                  <StepDocuments
                    documents={form.documents}
                    sensitive={isSensitive(form.integration)}
                    errors={errors}
                    onChange={(key, files) => update("documents", key, files)}
                  />
                )}
                {step === 4 && (
                  <StepReview
                    form={form}
                    errors={errors}
                    onChange={(key, value) => update("declaration", key, value)}
                    onEdit={goTo}
                  />
                )}

                {hasErrors && (
                  <p className="form-alert" role="alert">
                    Revisa los campos marcados antes de continuar.
                  </p>
                )}
                {submitError && (
                  <p className="form-alert" role="alert">
                    {submitError}
                  </p>
                )}

                <div className="form-actions">
                  {step > 0 && (
                    <button
                      type="button"
                      className="btn btn--secondary"
                      onClick={() => goTo(step - 1)}
                      disabled={submitting}
                    >
                      Atrás
                    </button>
                  )}
                  <button
                    type="submit"
                    className={`btn btn--primary${submitting ? " btn--loading" : ""}`}
                    disabled={submitting}
                  >
                    {step === STEPS.length - 1 ? "Enviar y obtener API" : "Continuar"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
