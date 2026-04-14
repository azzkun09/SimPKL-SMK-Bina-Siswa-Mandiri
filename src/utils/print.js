export const handlePrintAction = (elementId = 'print-area') => {
  const printArea = document.getElementById(elementId);

  if (!printArea) {
    alert("Dokumen tidak ditemukan!");
    return;
  }

  const newWin = window.open('', '_blank');

  if (!newWin) {
    alert('Pop-up diblokir oleh browser.');
    return;
  }

  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((s) => s.outerHTML)
    .join('\n');

  newWin.document.open();
  newWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Dokumen</title>
        ${styles}
      </head>
      <body>
        ${printArea.outerHTML}
      </body>
    </html>
  `);

  newWin.document.close();

  setTimeout(() => {
    newWin.print();
  }, 500);
};