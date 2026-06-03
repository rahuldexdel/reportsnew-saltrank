// reportExport.ts

import { jsPDF } from "jspdf";
import html2canvas from "html2canvas-pro";
import PptxGenJS from "pptxgenjs";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* =========================
   SINGLE TAB PDF
========================= */


export const generateSinglePDF = async (
  element: HTMLElement,
  activeTab: string
) => {
  const clonedNode = element.cloneNode(true) as HTMLElement;

  const tabTitleMap: Record<string, string> = {
    overview: "Overview",
    semrush: "Semrush",
    "call-tracking": "Call Tracking",
    "google-ads": "Google Ads",
  };

  // ✅ Add heading
  const heading = document.createElement("h2");
  heading.innerText = tabTitleMap[activeTab] || activeTab;

  Object.assign(heading.style, {
    fontSize: "28px",
    fontWeight: "700",
    textAlign: "center",
    margin: "40px 0 30px",
    borderBottom: "3px solid #000",
    paddingBottom: "12px",
  });

  clonedNode.insertBefore(heading, clonedNode.firstChild);

  // ✅ Move off-screen (important)
  clonedNode.style.position = "absolute";
  clonedNode.style.left = "-9999px";
  clonedNode.style.top = "0";
  clonedNode.style.width = `${element.offsetWidth}px`;

  document.body.appendChild(clonedNode);

  try {
    // ✅ Reduce scale for heavy tabs like Google Ads
    const scale = activeTab === "google-ads" ? 1 : 1.6;

    const canvas = await html2canvas(clonedNode, {
      scale,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // 👇 convert PDF height to canvas pixels
    const pageHeightPx = (canvasWidth * pdfHeight) / pdfWidth;

    let y = 0;
    let pageIndex = 0;

    while (y < canvasHeight) {
      const pageCanvas = document.createElement("canvas");
      const pageHeight = Math.min(pageHeightPx, canvasHeight - y);

      pageCanvas.width = canvasWidth;
      pageCanvas.height = pageHeight;

      const ctx = pageCanvas.getContext("2d")!;
      ctx.drawImage(
        canvas,
        0,
        y,
        canvasWidth,
        pageHeight,
        0,
        0,
        canvasWidth,
        pageHeight
      );

      // ✅ IMPORTANT: use JPEG (fixes Invalid string length)
      const imgData = pageCanvas.toDataURL("image/jpeg", 0.85);

      if (pageIndex > 0) pdf.addPage();

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        pdfWidth,
        (pageHeight * pdfWidth) / canvasWidth
      );

      y += pageHeightPx;
      pageIndex++;
    }

    pdf.save(`${activeTab}_report.pdf`);
  } catch (error) {
    console.error("PDF generation failed:", error);
  } finally {
    document.body.removeChild(clonedNode);
  }
};

/* =========================
   SINGLE TAB PPT
========================= */
export const generateSinglePPT = async (
  element: HTMLElement,
  activeTab: string
) => {
  const clonedNode = element.cloneNode(true) as HTMLElement;

  clonedNode.style.position = "absolute";
  clonedNode.style.left = "-9999px";
  clonedNode.style.width = "1400px";

  document.body.appendChild(clonedNode);

  const canvas = await html2canvas(clonedNode, {
    scale: 3,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  const slideWidth = 13.3;
  const slideHeight = 7.5;

  const imgHeight = (canvas.height * slideWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  while (heightLeft > 0) {
    const slide = pptx.addSlide();

    slide.addImage({
      data: imgData,
      x: 0,
      y: position,
      w: slideWidth,
      h: imgHeight,
    });

    heightLeft -= slideHeight;
    position -= slideHeight;
  }

  await pptx.writeFile({ fileName: `${activeTab}_report.pptx` });

  document.body.removeChild(clonedNode);
};

/* =========================
   BOTH TABS PDF
========================= */
export const generateBothTabsPDF = async (
  fetchBothTabs: () => Promise<void>,
  waitForRender: () => Promise<void>
) => {
  await fetchBothTabs();
  await waitForRender();

  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const sections = document.querySelectorAll(".pdf-section");

  let isFirstPage = true;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i] as HTMLElement;

    // ✅ Clone to avoid UI break + control layout
    const cloned = section.cloneNode(true) as HTMLElement;

    cloned.style.position = "absolute";
    cloned.style.left = "-9999px";
    cloned.style.top = "0";
    cloned.style.width = `${section.offsetWidth}px`;

    document.body.appendChild(cloned);

    try {
      // ✅ Reduce scale for heavy sections
      const isHeavy =
        cloned.innerText.includes("Google Ads") ||
        cloned.innerText.includes("Campaign");

      const scale = isHeavy ? 1 : 1.6;

      const canvas = await html2canvas(cloned, {
        scale,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const pageHeightPx = (canvasWidth * pdfHeight) / pdfWidth;

      let y = 0;

      while (y < canvasHeight) {
        const pageCanvas = document.createElement("canvas");
        const pageHeight = Math.min(pageHeightPx, canvasHeight - y);

        pageCanvas.width = canvasWidth;
        pageCanvas.height = pageHeight;

        const ctx = pageCanvas.getContext("2d")!;
        ctx.drawImage(
          canvas,
          0,
          y,
          canvasWidth,
          pageHeight,
          0,
          0,
          canvasWidth,
          pageHeight
        );

        // ✅ Use JPEG (critical fix)
        const imgData = pageCanvas.toDataURL("image/jpeg", 0.85);

        if (!isFirstPage) {
          pdf.addPage();
        }

        pdf.addImage(
          imgData,
          "JPEG",
          0,
          0,
          pdfWidth,
          (pageHeight * pdfWidth) / canvasWidth
        );

        isFirstPage = false;
        y += pageHeightPx;
      }
    } catch (err) {
      console.error("Section PDF error:", err);
    } finally {
      document.body.removeChild(cloned);
    }
  }

  pdf.save("dashboard_report.pdf");
};
/* =========================
   BOTH TABS PPT
========================= */
export const generateBothTabsPPT = async (
  fetchBothTabs: () => Promise<void>,
  waitForRender: () => Promise<void>
) => {
  await fetchBothTabs();
  await waitForRender();

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";

  const slideWidth = 13.3;
  const slideHeight = 7.5;

  const sections = document.querySelectorAll(".pdf-section");

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i] as HTMLElement;

    const canvas = await html2canvas(section, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const imgHeight = (canvas.height * slideWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    while (heightLeft > 0) {
      const slide = pptx.addSlide();

      slide.addImage({
        data: imgData,
        x: 0,
        y: position,
        w: slideWidth,
        h: imgHeight,
      });

      heightLeft -= slideHeight;
      position -= slideHeight;
    }
  }

  await pptx.writeFile({ fileName: "dashboard_report.pptx" });
};


export const generateOverviewExcel = (
  overviewData: any,
  range: string,
  filterKey: string
) => {

  const safeRange = range?.includes(":") ? "7" : range || "7";
  const safeFilterKey = filterKey || "default";

  const data = overviewData?.[safeRange]?.[safeFilterKey];
  if (!data) return;

  const currentTotals = data.totals?.current || {};
  const previousTotals = data.totals?.previous || {};

  const currentCalls = data.callrail?.timeseries?.current?.total_results || {};
  const previousCalls = data.callrail?.timeseries?.previous?.total_results || {};

  const excelData = [
    {
      Metric: "Total Impressions",
      "This Period": currentTotals.impressions || 0,
      "Prior Period": previousTotals.impressions || 0,
    },
    {
      Metric: "Walk-Ins",
      "This Period": currentTotals.walkIns || 0,
      "Prior Period": previousTotals.walkIns || 0,
    },
    {
      Metric: "Total Calls",
      "This Period": currentCalls.total_calls || 0,
      "Prior Period": previousCalls.total_calls || 0,
    },
    {
      Metric: "First Time Callers",
      "This Period": currentCalls.first_time_callers || 0,
      "Prior Period": previousCalls.first_time_callers || 0,
    },
    {
      Metric: "Unique Calls",
      "This Period": currentCalls.answered_calls || 0,
      "Prior Period": previousCalls.answered_calls || 0,
    },
    {
      Metric: "Qualified Calls",
      "This Period": currentCalls.leads || 0,
      "Prior Period": previousCalls.leads || 0,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Overview");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "overview_report.xlsx");
};


export const previewBothTabsPDF = async (
  fetchBothTabs: () => Promise<void>,
  waitForRender: () => Promise<void>
) => {
  await fetchBothTabs();
  await waitForRender();

  const pdf = new jsPDF("p", "mm", "a4");
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  const sections = document.querySelectorAll(".pdf-section");

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i] as HTMLElement;

    const canvas = await html2canvas(section, {
      scale: 1.3,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    if (i !== 0) pdf.addPage();

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
  }

  // 🔥 Instead of saving → return blob
  return pdf.output("blob");
};