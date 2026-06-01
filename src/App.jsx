import { useState } from 'react';
import { calculateScores } from './utils/calculator';
import { generatePDF } from './utils/pdfGenerator';
import { questions } from './utils/questions';
import {
  AlertCircle, CheckCircle2, Download, FileText,
  User, Calendar, GraduationCap, Info,
} from 'lucide-react';
import './App.css';

// ─── Constants ────────────────────────────────────────────────────────────────

const OPTIONS = [
  { value: 0, label: 'COMPLETAMENTE FALSO' },
  { value: 1, label: 'BASTANTE FALSO' },
  { value: 2, label: 'ALGO FALSO' },
  { value: 3, label: 'ALGO VERDADERO' },
  { value: 4, label: 'BASTANTE VERDADERO' },
  { value: 5, label: 'COMPLETAMENTE VERDADERO' },
];

const SEXO_OPTIONS     = ['Masculino', 'Femenino', 'No binario', 'Prefiero no indicar'];
const EDUCACION_OPTIONS = [
  'Sin estudios formales', 'Primaria', 'Secundaria',
  'Técnico / Terciario', 'Universitario (en curso)',
  'Universitario (completo)', 'Posgrado / Maestría', 'Doctorado',
];

const todayISO = new Date().toISOString().split('T')[0];

// ─── Component ────────────────────────────────────────────────────────────────

function App() {
  const [answers,      setAnswers]      = useState({});
  const [patientData,  setPatientData]  = useState({
    nombre:           '',
    edad:             '',
    sexo:             '',
    fechaEvaluacion:  todayISO,
    nivelEducativo:   '',
  });
  const [showWarning,  setShowWarning]  = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Handlers ───────────────────────────────────────────────────────────
  /**
   * Toggle handler: clicking an already-selected option deselects it
   * (removes the key from answers), enabling the AR scale to count blanks.
   */
  const handleOptionClick = (idx, value) => {
    setAnswers(prev => {
      const next = { ...prev };
      if (next[idx] === value) {
        delete next[idx]; // deselect → answer becomes blank
      } else {
        next[idx] = value;
      }
      return next;
    });
    setShowWarning(false);
  };

  const handlePatient = (field, value) =>
    setPatientData(prev => ({ ...prev, [field]: value }));

  const getMissing = () =>
    Array.from({ length: questions.length }, (_, i) => i)
      .filter(i => answers[i] === undefined);

  const handleGenerateReport = async () => {
    const missing = getMissing();

    // Show informational warning but DO NOT block generation
    if (missing.length > 0) setShowWarning(true);

    setIsGenerating(true);
    try {
      const scores = calculateScores(answers, questions.length);
      await generatePDF(scores, patientData);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Hubo un error al generar el PDF. Por favor, inténtelo de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  const missing  = getMissing();
  const answered = questions.length - missing.length;
  const progress = Math.round((answered / questions.length) * 100);

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">

      {/* ── Sticky header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm px-6 py-3 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-blue-600" size={22} />
            Inventario ICCP
          </h1>
          <p className="text-xs text-slate-500">Inventario de los Cinco Continuos de la Personalidad</p>
        </div>

        <div className="flex items-center gap-5">
          {/* Progress bar */}
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-slate-600">
              {answered}/{questions.length} respondidas ({progress}%)
            </span>
            <div className="w-36 h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            id="btn-generar-informe-header"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all
              ${isGenerating
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md active:scale-95'
              }`}
          >
            {isGenerating ? 'Generando…' : <><Download size={16} /> Generar Informe</>}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">

        {/* ── Patient data form ─────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 flex items-center gap-2">
            <User size={18} className="text-blue-100" />
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">
              Datos del Evaluado
            </h2>
          </div>

          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nombre */}
            <div className="sm:col-span-2">
              <label className="label-form" htmlFor="pd-nombre">Nombre completo</label>
              <input
                id="pd-nombre"
                type="text"
                value={patientData.nombre}
                onChange={e => handlePatient('nombre', e.target.value)}
                placeholder="Apellido, Nombre"
                className="input-form"
              />
            </div>

            {/* Edad */}
            <div>
              <label className="label-form" htmlFor="pd-edad">Edad</label>
              <input
                id="pd-edad"
                type="number"
                min="1" max="120"
                value={patientData.edad}
                onChange={e => handlePatient('edad', e.target.value)}
                placeholder="años"
                className="input-form"
              />
            </div>

            {/* Sexo */}
            <div>
              <label className="label-form" htmlFor="pd-sexo">Sexo / Género</label>
              <select
                id="pd-sexo"
                value={patientData.sexo}
                onChange={e => handlePatient('sexo', e.target.value)}
                className="input-form"
              >
                <option value="">— Seleccionar —</option>
                {SEXO_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Fecha de Evaluación */}
            <div>
              <label className="label-form" htmlFor="pd-fecha">
                <Calendar size={13} className="inline mr-1 text-blue-500" />
                Fecha de Evaluación
              </label>
              <input
                id="pd-fecha"
                type="date"
                value={patientData.fechaEvaluacion}
                onChange={e => handlePatient('fechaEvaluacion', e.target.value)}
                className="input-form"
              />
            </div>

            {/* Nivel Educativo */}
            <div>
              <label className="label-form" htmlFor="pd-educacion">
                <GraduationCap size={13} className="inline mr-1 text-blue-500" />
                Nivel Educativo
              </label>
              <select
                id="pd-educacion"
                value={patientData.nivelEducativo}
                onChange={e => handlePatient('nivelEducativo', e.target.value)}
                className="input-form"
              >
                <option value="">— Seleccionar —</option>
                {EDUCACION_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
        </section>

        {/* ── Instructions ─────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Info size={17} className="text-blue-500" /> Instrucciones
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            A continuación se presentan una serie de afirmaciones sobre sus pensamientos, sentimientos y
            comportamientos. Lea cada una cuidadosamente y seleccione la opción que mejor describa qué tan
            verdadera o falsa es para usted. Puede dejar preguntas sin responder; estas quedarán registradas
            como <strong>Ausencia de Respuesta (AR)</strong> en el informe.
          </p>
        </section>

        {/* ── Warning banner (informational, non-blocking) ──────────────── */}
        {showWarning && missing.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-xl shadow-sm flex items-start gap-3 sticky top-20 z-10">
            <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-bold text-amber-800">
                {missing.length} pregunta{missing.length > 1 ? 's' : ''} sin responder
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Ítems:{' '}
                <span className="font-medium">{missing.slice(0, 15).map(i => i + 1).join(', ')}</span>
                {missing.length > 15 && ` y ${missing.length - 15} más…`}
                <span className="ml-2">— Se registrarán como AR en el informe.</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Questions list ────────────────────────────────────────────── */}
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isAnswered = answers[idx] !== undefined;
            const isMissing  = showWarning && !isAnswered;

            return (
              <div
                key={idx}
                id={`question-${idx}`}
                className={`bg-white rounded-xl shadow-sm border p-5 transition-all duration-200
                  ${isMissing  ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-300' : 'border-slate-200'}
                  ${isAnswered ? 'border-l-4 border-l-emerald-500' : ''}
                `}
              >
                <div className="flex gap-3 mb-4">
                  {isAnswered
                    ? <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                    : <span className="text-xs font-bold text-slate-400 mt-1 w-5 text-center shrink-0">{idx + 1}</span>
                  }
                  <p className={`text-sm font-medium leading-snug ${isAnswered ? 'text-slate-600' : 'text-slate-900'}`}>
                    {q}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                  {OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-lg border cursor-pointer
                        transition-all text-center select-none
                        ${answers[idx] === opt.value
                          ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500 shadow-sm'
                          : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-500'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        value={opt.value}
                        checked={answers[idx] === opt.value}
                        onChange={() => {}} // controlled; toggle handled by onClick
                        onClick={() => handleOptionClick(idx, opt.value)}
                        className="sr-only"
                      />
                      <span className="text-[10px] font-semibold leading-tight">{opt.label}</span>
                      <span className="text-[10px] mt-0.5 opacity-50">({opt.value})</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Floating bottom button ────────────────────────────────────── */}
        <div className="mt-10 flex justify-center pb-6">
          <button
            id="btn-generar-informe-bottom"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className={`flex items-center gap-3 px-10 py-4 rounded-full font-bold text-base shadow-xl transition-all
              ${isGenerating
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-2xl active:scale-95'
              }
            `}
          >
            {isGenerating
              ? <><span className="animate-spin inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full" /> Generando PDF…</>
              : <><Download size={22} /> Generar Informe Final</>
            }
          </button>
        </div>

      </main>
    </div>
  );
}

export default App;
