/**
 * DomusVita Platform - Datenschutzerklärung (Privacy Policy)
 * Shared public page component used by all 6 frontend modules.
 * No authentication required.
 *
 * NOTE: This is a local copy of the shared component from the monorepo.
 * Source: packages/shared-ui/components/platform/Datenschutz.jsx
 */

import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Section wrapper for consistent heading and body spacing.
 *
 * @param {Object} props
 * @param {string} props.title - Section heading text
 * @param {React.ReactNode} props.children - Section body content
 */
function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">
        {title}
      </h2>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

/**
 * Datenschutz - DSGVO-konforme Datenschutzerklärung für die DomusVita-Plattform.
 * Alle 6 Module (Portal, SGB XII, Controlling, Immobilien, QM, Terminmanagement)
 * sind durch diese Erklärung abgedeckt.
 */
export default function Datenschutz() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-cyan-700 tracking-tight">DomusVita</span>
          <Link
            to="/"
            className="text-sm text-cyan-600 hover:text-cyan-800 transition-colors font-medium"
          >
            &#8592; Zurück
          </Link>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Page title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
          <p className="text-sm text-gray-500">Stand: März 2026 | Version 1.0</p>
        </div>

        {/* 1. Verantwortlicher */}
        <Section title="1. Verantwortlicher">
          <p>
            DomusVita Gesundheit GmbH<br />
            Waldemarstraße 10a<br />
            10999 Berlin
          </p>
          <p className="mt-3">
            Handelsregister: HRB 127949 B (Amtsgericht Charlottenburg)<br />
            Geschäftsführung: Annette Dahrendorf, Alexander Ebel, Stephan Ebel
          </p>
          <p className="mt-3">
            E-Mail:{' '}
            <a href="mailto:info@domusvita.de" className="text-cyan-600 hover:underline">
              info@domusvita.de
            </a>
            <br />
            Telefon: +49 30 695 669 70
          </p>
        </Section>

        {/* 2. Datenschutzbeauftragter */}
        <Section title="2. Datenschutzbeauftragter">
          <p>
            Für Datenschutzanfragen wenden Sie sich bitte an unseren Datenschutzbeauftragten:
          </p>
          <p className="mt-3">
            E-Mail:{' '}
            <a href="mailto:datenschutz@domusvita.de" className="text-cyan-600 hover:underline">
              datenschutz@domusvita.de
            </a>
          </p>
        </Section>

        {/* 3. Geltungsbereich */}
        <Section title="3. Geltungsbereich">
          <p>
            Diese Datenschutzerklärung gilt für alle Verarbeitungen personenbezogener Daten
            im Rahmen der DomusVita-Plattform, bestehend aus folgenden Modulen:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              <strong>Portal</strong> — Zentrales Auth-Gateway, Mitarbeiterverwaltung,
              KI-Wissensdatenbank
            </li>
            <li>
              <strong>SGB XII Rechnungsmodul</strong> — Sozialhilfe-Abrechnung,
              Korrekturrechnung, Widerspruchsmanagement
            </li>
            <li>
              <strong>Controlling</strong> — Finanzkennzahlen, Umsatzanalysen, OP-Abgleich
            </li>
            <li>
              <strong>Immobilienverwaltung</strong> — Objektverwaltung, Pflege-WGs,
              Klientenmanagement
            </li>
            <li>
              <strong>QM Qualitätsmanagement</strong> — Digitales Qualitätshandbuch,
              Recruiting, Mitarbeiter-Onboarding
            </li>
            <li>
              <strong>Terminmanagement</strong> — Arzttermin-Verwaltung für Pflegeklienten
            </li>
          </ul>
        </Section>

        {/* 4. Rechtsgrundlagen */}
        <Section title="4. Rechtsgrundlagen der Verarbeitung">
          <p>
            Die Verarbeitung personenbezogener Daten erfolgt auf Basis folgender
            Rechtsgrundlagen gemäß DSGVO:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> — Vertragserfüllung (Pflege-
              und Betreuungsverträge)
            </li>
            <li>
              <strong>Art. 6 Abs. 1 lit. c DSGVO</strong> — Rechtliche Verpflichtung
              (SGB XI, SGB XII, HGB)
            </li>
            <li>
              <strong>Art. 6 Abs. 1 lit. f DSGVO</strong> — Berechtigtes Interesse
              (IT-Sicherheit, Qualitätssicherung)
            </li>
            <li>
              <strong>Art. 9 Abs. 2 lit. h DSGVO</strong> — Gesundheitsversorgung
              (Verarbeitung von Pflegedaten)
            </li>
            <li>
              <strong>Art. 6 Abs. 1 lit. a DSGVO</strong> — Einwilligung
              (WhatsApp-Kommunikation im QM-Modul)
            </li>
          </ul>
        </Section>

        {/* 5. Datenkategorien */}
        <Section title="5. Kategorien verarbeiteter Daten">
          <p>
            Je nach genutztem Modul verarbeiten wir folgende Kategorien personenbezogener Daten:
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold">
                    Kategorie
                  </th>
                  <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold">
                    Beispiele
                  </th>
                  <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold">
                    Module
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2">Stammdaten</td>
                  <td className="px-3 py-2">Name, Adresse, Geburtsdatum</td>
                  <td className="px-3 py-2">Alle</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2">Gesundheitsdaten (Art. 9)</td>
                  <td className="px-3 py-2">Pflegegrad, Leistungskomplexe, Diagnosen</td>
                  <td className="px-3 py-2">SGB XII, Immobilien, TM</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2">Finanzdaten</td>
                  <td className="px-3 py-2">Rechnungen, Vergütungen, Bankverbindungen</td>
                  <td className="px-3 py-2">SGB XII, Controlling</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2">Beschäftigtendaten</td>
                  <td className="px-3 py-2">Qualifikationen, Arbeitszeiten, Kontaktdaten</td>
                  <td className="px-3 py-2">Portal, QM</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2">Kommunikationsdaten</td>
                  <td className="px-3 py-2">E-Mails, WhatsApp-Nachrichten</td>
                  <td className="px-3 py-2">Immobilien, QM</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2">Nutzungsdaten</td>
                  <td className="px-3 py-2">Login-Zeitpunkte, IP-Adressen</td>
                  <td className="px-3 py-2">Alle</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* 6. Empfänger und Auftragsverarbeiter */}
        <Section title="6. Empfänger und Auftragsverarbeiter">
          <p>
            Zur Erbringung unserer Dienste setzen wir folgende Auftragsverarbeiter ein.
            Mit jedem Dienstleister besteht ein Auftragsverarbeitungsvertrag (AVV) gemäß
            Art. 28 DSGVO:
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold">
                    Dienstleister
                  </th>
                  <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold">
                    Zweck
                  </th>
                  <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold">
                    Standort
                  </th>
                  <th className="text-left px-3 py-2 border-b border-gray-200 font-semibold">
                    Garantie
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">Microsoft Azure</td>
                  <td className="px-3 py-2">Hosting, Datenbanken, Authentifizierung</td>
                  <td className="px-3 py-2">EU (West Europe)</td>
                  <td className="px-3 py-2">EU-US DPF</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">Anthropic PBC</td>
                  <td className="px-3 py-2">KI-gestützte Dokumentenanalyse (OCR)</td>
                  <td className="px-3 py-2">USA</td>
                  <td className="px-3 py-2">SCC + TIA</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">Twilio Inc.</td>
                  <td className="px-3 py-2">WhatsApp-Benachrichtigungen (QM)</td>
                  <td className="px-3 py-2">USA</td>
                  <td className="px-3 py-2">SCC + DPA</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium">Sentry (Functional Software)</td>
                  <td className="px-3 py-2">Fehlerüberwachung</td>
                  <td className="px-3 py-2">USA</td>
                  <td className="px-3 py-2">SCC</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            Für alle US-Dienstleister bestehen Standardvertragsklauseln (SCC) gemäß
            Art. 46 Abs. 2 lit. c DSGVO. Es werden keine personenbezogenen Daten an Dritte
            zu Werbezwecken weitergegeben.
          </p>
        </Section>

        {/* 7. Speicherdauer */}
        <Section title="7. Speicherdauer">
          <p>
            Wir speichern personenbezogene Daten nur so lange, wie es für den jeweiligen
            Verarbeitungszweck erforderlich ist oder gesetzliche Aufbewahrungspflichten
            bestehen:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              <strong>SGB XII / Finanzdaten:</strong> 10 Jahre (§ 257 HGB, § 147 AO)
            </li>
            <li>
              <strong>Klientendaten:</strong> Dauer der Pflegebeziehung + 10 Jahre
            </li>
            <li>
              <strong>Mitarbeiterdaten:</strong> Dauer des Arbeitsverhältnisses + 3 Jahre
            </li>
            <li>
              <strong>Bewerberdaten:</strong> 6 Monate nach Abschluss des Verfahrens
            </li>
            <li>
              <strong>Log-Daten (IT-Sicherheit):</strong> 90 Tage
            </li>
            <li>
              <strong>Sessions / OTP-Codes:</strong> 48 Stunden / 1 Stunde
            </li>
          </ul>
          <p className="mt-3 text-sm text-gray-500">
            Nach Ablauf der jeweiligen Frist werden die Daten automatisiert gelöscht
            oder anonymisiert.
          </p>
        </Section>

        {/* 8. Betroffenenrechte */}
        <Section title="8. Ihre Rechte als betroffene Person">
          <p>
            Ihnen stehen folgende Rechte bezüglich Ihrer personenbezogenen Daten zu:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              <strong>Auskunftsrecht (Art. 15 DSGVO)</strong> — Auskunft über die zu
              Ihrer Person gespeicherten Daten
            </li>
            <li>
              <strong>Berichtigungsrecht (Art. 16 DSGVO)</strong> — Berichtigung
              unrichtiger oder unvollständiger Daten
            </li>
            <li>
              <strong>Löschungsrecht (Art. 17 DSGVO)</strong> — Löschung Ihrer Daten,
              soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen
            </li>
            <li>
              <strong>Einschränkung der Verarbeitung (Art. 18 DSGVO)</strong> —
              Einschränkung der Verarbeitung unter bestimmten Voraussetzungen
            </li>
            <li>
              <strong>Datenübertragbarkeit (Art. 20 DSGVO)</strong> — Erhalt Ihrer
              Daten in einem strukturierten, maschinenlesbaren Format
            </li>
            <li>
              <strong>Widerspruchsrecht (Art. 21 DSGVO)</strong> — Widerspruch gegen
              Verarbeitungen, die auf berechtigtem Interesse beruhen
            </li>
            <li>
              <strong>Widerruf der Einwilligung (Art. 7 Abs. 3 DSGVO)</strong> —
              Widerruf einer erteilten Einwilligung mit Wirkung für die Zukunft
            </li>
          </ul>
          <p className="mt-4">
            Zur Ausübung Ihrer Rechte wenden Sie sich bitte per E-Mail an:{' '}
            <a
              href="mailto:datenschutz@domusvita.de"
              className="text-cyan-600 hover:underline font-medium"
            >
              datenschutz@domusvita.de
            </a>
          </p>
        </Section>

        {/* 9. KI-Verarbeitung */}
        <Section title="9. Einsatz von Künstlicher Intelligenz">
          <p>
            Wir setzen KI-basierte Systeme (Anthropic Claude) zur Unterstützung folgender
            Prozesse ein:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              Optische Zeichenerkennung (OCR) von Bescheiden und Rechnungen
            </li>
            <li>
              Unterstützung bei der Erstellung von Widerspruchsschreiben
            </li>
            <li>
              Zusammenfassung von Kommunikationsinhalten
            </li>
            <li>
              Dienstplan-Optimierung (ausschließlich mit anonymisierten Mitarbeiterdaten)
            </li>
          </ul>
          <p className="mt-3">
            Es findet kein automatisiertes Profiling und keine automatisierte
            Einzelentscheidung im Sinne von Art. 22 DSGVO statt. Alle KI-generierten
            Inhalte unterliegen einer obligatorischen manuellen Prüfpflicht durch
            autorisierte Mitarbeitende.
          </p>
        </Section>

        {/* 10. Technische und organisatorische Maßnahmen */}
        <Section title="10. Technische und organisatorische Maßnahmen (TOM)">
          <p>
            Wir schützen Ihre Daten durch geeignete technische und organisatorische
            Maßnahmen gemäß Art. 25 und Art. 32 DSGVO:
          </p>
          <ul className="list-disc pl-6 mt-3 space-y-2">
            <li>
              Verschlüsselung aller Daten in Transit (TLS 1.2+) und at Rest
              (AES-256)
            </li>
            <li>
              Authentifizierung über Microsoft Entra ID (RBAC) bzw. Argon2id +
              TOTP-MFA
            </li>
            <li>
              Secrets-Management in Azure Key Vault (Managed Identity, kein
              Klartext in Code)
            </li>
            <li>
              Rate Limiting und Input-Validierung auf allen API-Endpoints
            </li>
            <li>
              Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options)
            </li>
            <li>
              Regelmäßige Container-Image-Scans (Trivy) und Dependency-Updates
            </li>
            <li>
              Strukturiertes Logging und Monitoring (Sentry), 90-Tage-Rotation
            </li>
            <li>
              Automatische Datenbereinigung nach Ablauf der Aufbewahrungsfristen
            </li>
            <li>
              Zugriffsbeschränkung nach dem Least-Privilege-Prinzip (Need-to-Know)
            </li>
          </ul>
        </Section>

        {/* 11. Beschwerderecht */}
        <Section title="11. Beschwerderecht bei der Aufsichtsbehörde">
          <p>
            Unbeschadet anderer Rechtsbehelfe haben Sie das Recht, sich bei der
            zuständigen Datenschutz-Aufsichtsbehörde zu beschweren, wenn Sie der
            Ansicht sind, dass die Verarbeitung Ihrer personenbezogenen Daten gegen
            die DSGVO verstößt (Art. 77 DSGVO):
          </p>
          <p className="mt-4 bg-gray-100 rounded-lg p-4 text-sm">
            <strong>Berliner Beauftragte für Datenschutz und Informationsfreiheit</strong>
            <br />
            Friedrichstraße 219<br />
            10969 Berlin
            <br /><br />
            E-Mail:{' '}
            <a
              href="mailto:mailbox@datenschutz-berlin.de"
              className="text-cyan-600 hover:underline"
            >
              mailbox@datenschutz-berlin.de
            </a>
            <br />
            Telefon: +49 30 13889-0<br />
            Web:{' '}
            <a
              href="https://www.datenschutz-berlin.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-600 hover:underline"
            >
              www.datenschutz-berlin.de
            </a>
          </p>
        </Section>

        {/* 12. Änderungen */}
        <Section title="12. Änderungen dieser Datenschutzerklärung">
          <p>
            Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren,
            um sie an geänderte Rechtslagen, Plattformfunktionen oder
            Verarbeitungspraktiken anzupassen. Die jeweils aktuelle Fassung ist in allen
            Modulen unter <strong>/datenschutz</strong> abrufbar. Das Datum der letzten
            Aktualisierung ist am Anfang dieser Erklärung angegeben.
          </p>
        </Section>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-400 flex flex-col sm:flex-row justify-between gap-2">
          <p>
            &copy; {new Date().getFullYear()} DomusVita Gesundheit GmbH — Alle Rechte
            vorbehalten.
          </p>
          <p>Version 1.0 | Stand: März 2026</p>
        </div>
      </div>
    </div>
  );
}
