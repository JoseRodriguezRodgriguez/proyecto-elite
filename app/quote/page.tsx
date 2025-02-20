"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function QuotePage() {
  // Estado para los campos de la cotización
  const [quoteDate, setQuoteDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [greeting, setGreeting] = useState<string>(
    `San Salvador, ${format(new Date(), "dd 'de' MMMM 'de' yyyy")}`
  );
  const [body, setBody] = useState<string>(
    "COTIZACIÓN DE RESTAURADO Y PULIDO DE SILLAS DE ESCRITORIO\n\n" +
      "Respetables Señores:\nReciban un cordial saludo de la Familia Elite. Nos complace presentar la cotización para el servicio de restauración, pulido y abrillantado de sillas de escritorio..."
  );

  // Función para generar el PDF
  const handleSavePDF = async () => {
    const element = document.getElementById("quote-content");
    if (!element) return;
    // Generamos una imagen del contenido usando html2canvas
    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL("image/png");

    // Configuramos jsPDF para una página A4 (210 x 297 mm)
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Calculamos la altura para mantener la proporción
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("cotizacion.pdf");
  };

  // Función para descartar cambios (resetear campos)
  const handleDiscard = () => {
    setQuoteDate(format(new Date(), "yyyy-MM-dd"));
    setGreeting(`San Salvador, ${format(new Date(), "dd 'de' MMMM 'de' yyyy")}`);
    setBody("");
  };

  return (
    <div className="p-4">
      {/* Header con el logo */}
      <header className="mb-4">
        <img src="/EliteLogo.svg" alt="Logo Elite" className="h-16" />
      </header>

      {/* Área principal de la cotización, que se usará para generar el PDF */}
      <div id="quote-content" className="border p-4">
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Fecha:</label>
          <Input
            type="date"
            value={quoteDate}
            onChange={(e) => setQuoteDate(e.target.value)}
            min={format(new Date(), "yyyy-MM-dd")}
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Saludo:</label>
          <Input
            type="text"
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
          />
        </div>
        <div className="mb-2">
          <label className="block mb-1 font-semibold">Cuerpo de la Cotización:</label>
          <textarea
            className="w-full border p-2"
            rows={10}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-4 border-t pt-2 text-center text-sm">
        <p>Elite Company &mdash; Cotización Generada</p>
      </footer>

      {/* Botones para guardar como PDF o descartar cambios */}
      <div className="mt-4 flex gap-4">
        <Button onClick={handleSavePDF}>Guardar como PDF</Button>
        <Button variant="destructive" onClick={handleDiscard}>
          Descartar Cambios
        </Button>
      </div>
    </div>
  );
}
