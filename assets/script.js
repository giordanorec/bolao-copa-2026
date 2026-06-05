/*
 * Bolão das IAs — sort de tabela por clique.
 * Zero deps. Suporta data-sort="num" | "str".
 */
(function () {
  "use strict";

  function parseCell(cell, kind) {
    var raw = (cell.dataset.sortValue ?? cell.textContent ?? "").trim();
    if (kind === "num") {
      var n = parseFloat(raw.replace(/[^\d.\-]/g, ""));
      return Number.isFinite(n) ? n : -Infinity;
    }
    return raw.toLocaleLowerCase("pt-BR");
  }

  function sortTable(table, colIndex, kind, asc) {
    var tbody = table.tBodies[0];
    if (!tbody) return;
    var rows = Array.prototype.slice.call(tbody.rows);
    rows.sort(function (a, b) {
      var va = parseCell(a.cells[colIndex], kind);
      var vb = parseCell(b.cells[colIndex], kind);
      if (va < vb) return asc ? -1 : 1;
      if (va > vb) return asc ? 1 : -1;
      return 0;
    });
    var frag = document.createDocumentFragment();
    rows.forEach(function (r) { frag.appendChild(r); });
    tbody.appendChild(frag);
  }

  document.querySelectorAll("table").forEach(function (table) {
    var headers = table.querySelectorAll("th.sortable");
    headers.forEach(function (th, idx) {
      th.addEventListener("click", function () {
        var kind = th.dataset.sort === "num" ? "num" : "str";
        var asc = !th.classList.contains("sort-asc");
        headers.forEach(function (h) { h.classList.remove("sort-asc", "sort-desc"); });
        th.classList.add(asc ? "sort-asc" : "sort-desc");
        sortTable(table, idx, kind, asc);
      });
      th.setAttribute("role", "button");
      th.setAttribute("tabindex", "0");
      th.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          th.click();
        }
      });
    });
  });
})();
