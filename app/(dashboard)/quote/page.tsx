"use client";

import { useState } from "react";
import {
  CalendarDays,
  Download,
  FileText,
  RotateCcw,
} from "lucide-react";
import {
  format,
  isValid,
  parse,
} from "date-fns";
import { es } from "date-fns/locale";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Image from "next/image";

import PageHeader from "@/components/dashboard/page-header";
import SectionCard from "@/components/dashboard/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getTodayInputValue() {
  return format(new Date(), "yyyy-MM-dd");
}

function formatQuoteDate(value: string) {
  const parsedDate = parse(
    value,
    "yyyy-MM-dd",
    new Date()
  );

  if (!isValid(parsedDate)) {
    return value;
  }

  return format(
    parsedDate,
    "dd 'de' MMMM 'de' yyyy",
    {
      locale: es,
    }
  );
}

export default function QuotePage() {
  const [quoteDate, setQuoteDate] =
    useState(getTodayInputValue);
  const [greeting, setGreeting] =
    useState("");
  const [body, setBody] =
    useState("");
  const [
    isGeneratingPdf,
    setIsGeneratingPdf,
  ] = useState(false);
  const [pdfError, setPdfError] =
    useState("");

  const handleSavePDF = async () => {
    const element =
      document.getElementById(
        "quote-preview"
      );

    if (!element) {
      setPdfError(
        "No se encontró la vista previa de la cotización."
      );
      return;
    }

    setPdfError("");
    setIsGeneratingPdf(true);

    try {
      const images = Array.from(
        element.querySelectorAll("img")
      );

      await Promise.all(
        images.map(
          (image) =>
            new Promise<void>(
              (resolve, reject) => {
                if (image.complete) {
                  resolve();
                  return;
                }
              
                image.onload = () => resolve();
                image.onerror = () =>
                  reject(
                    new Error(
                      "No se pudo cargar el logo."
                    )
                  );
              }
            )
        )
      );
      const canvas = await html2canvas(
        element,
        {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
        }
      );

      const imageData =
        canvas.toDataURL("image/png");

      const pdf = new jsPDF(
        "p",
        "mm",
        "a4"
      );

      const pageWidth =
        pdf.internal.pageSize.getWidth();
      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const margin = 10;
      const availableWidth =
        pageWidth - margin * 2;
      const availableHeight =
        pageHeight - margin * 2;

      const imageWidth =
        availableWidth;
      const imageHeight =
        (canvas.height * imageWidth) /
        canvas.width;

      let remainingHeight =
        imageHeight;
      let positionY = margin;

      pdf.addImage(
        imageData,
        "PNG",
        margin,
        positionY,
        imageWidth,
        imageHeight
      );

      remainingHeight -=
        availableHeight;

      while (remainingHeight > 0) {
        positionY =
          margin -
          (imageHeight -
            remainingHeight);

        pdf.addPage();

        pdf.addImage(
          imageData,
          "PNG",
          margin,
          positionY,
          imageWidth,
          imageHeight
        );

        remainingHeight -=
          availableHeight;
      }

      const fileDate =
        quoteDate ||
        getTodayInputValue();

      pdf.save(
        `cotizacion-${fileDate}.pdf`
      );
    } catch {
      setPdfError(
        "No se pudo generar el PDF. Inténtelo nuevamente."
      );
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDiscard = () => {
    setQuoteDate(
      getTodayInputValue()
    );
    setGreeting("");
    setBody("");
    setPdfError("");
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Cotización"
        description="Prepare el contenido, revise la vista previa y genere el documento en formato PDF."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscard}
              disabled={isGeneratingPdf}
            >
              <RotateCcw className="h-4 w-4" />
              Restablecer
            </Button>

            <Button
              type="button"
              onClick={handleSavePDF}
              disabled={
                isGeneratingPdf ||
                !body.trim()
              }
              className="bg-elite-gradient text-white shadow-sm hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPdf
                ? "Generando..."
                : "Guardar como PDF"}
            </Button>
          </div>
        }
      />

      {pdfError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {pdfError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <SectionCard
          title="Contenido de la cotización"
          description="Edite los datos que aparecerán en el documento."
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="quote-date">
                Fecha de emisión
              </Label>

              <div className="relative">
                <CalendarDays
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />

                <Input
                  id="quote-date"
                  type="date"
                  value={quoteDate}
                  onChange={(event) =>
                    setQuoteDate(
                      event.target.value
                    )
                  }
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quote-greeting">
                Encabezado o saludo
              </Label>

              <Input
                id="quote-greeting"
                type="text"
                value={greeting}
                placeholder="Ejemplo: Estimados clientes, nos complace..."
                onChange={(event) =>
                  setGreeting(
                    event.target.value
                  )
                }
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="quote-body">
                  Cuerpo de la cotización
                </Label>

                <span className="text-xs text-muted-foreground">
                  {body.length} caracteres
                </span>
              </div>

              <textarea
                id="quote-body"
                rows={18}
                value={body}
                placeholder={`Escriba aquí el contenido de la cotización.

                  Ejemplo:

                  COTIZACIÓN DE SERVICIO

                  Reciban un cordial saludo de la Familia Elite.

                  Por medio de la presente, detallamos la propuesta correspondiente al servicio solicitado:

                  • Descripción del servicio
                  • Cantidad
                  • Precio
                  • Condiciones de pago
                  • Tiempo estimado de ejecución

                  Agradecemos la oportunidad de presentar nuestra propuesta.`}
                onChange={(event) =>
                  setBody(
                    event.target.value
                  )
                }
                className="min-h-80 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <FileText
                  aria-hidden="true"
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                />

                <p>
                  El PDF se genera a partir de la vista previa de la derecha. Los campos de edición no aparecerán en el documento.
                </p>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Vista previa"
          description="Así se mostrará la cotización al exportarla."
          contentClassName="bg-muted/30 p-4 sm:p-6"
        >
          <article
            id="quote-preview"
            className="mx-auto min-h-[900px] w-full max-w-[794px] bg-white px-8 py-10 text-slate-900 shadow-sm sm:px-12 sm:py-14"
          >
            <header className="flex items-start justify-between gap-6 border-b border-slate-200 pb-6">
              <Image
                src="/EliteLogoDark.svg"
                alt="Logo de Elite Company"
                width={160}
                height={80}
                unoptimized
                priority
                className="h-auto w-40 object-contain"
              />

              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Cotización
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  Fecha de emisión
                </p>

                <p className="font-semibold">
                  {formatQuoteDate(
                    quoteDate
                  )}
                </p>
              </div>
            </header>

            <div className="py-8">
              <p className={`text-right text-sm ${
                greeting
                  ? "text-slate-600"
                  : "italic text-slate-400"
              }`}
            >
              {greeting ||
                "Aquí se mostrará el encabezado o saludo"}
              </p>

              <div className="mt-10 whitespace-pre-wrap text-sm leading-7">
                {body ? (
                  body
                ) : (
                  <span className="italic text-slate-400">
                    Aquí se mostrará el contenido de la cotización.
                  </span>
                )}
              </div>
            </div>

            <footer className="mt-12 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
              <p className="font-semibold text-slate-700">
                Elite Company
              </p>

              <p className="mt-1">
                Cotización generada mediante el sistema Elite
              </p>
            </footer>
          </article>
        </SectionCard>
      </div>
    </div>
  );
}