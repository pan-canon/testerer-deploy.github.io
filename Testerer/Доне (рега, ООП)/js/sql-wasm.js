// Подключение sql.js через CDN. Если хотите, можно удалить этот файл и подключить библиотеку напрямую.
if (typeof initSqlJs === "undefined") {
  var script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js";
  script.onload = () => console.log("sql.js загружен через CDN");
  document.head.appendChild(script);
} else {
  console.log("sql.js уже подключён");
}