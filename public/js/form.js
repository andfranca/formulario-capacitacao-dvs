(function () {
  "use strict";

  function alternarVisibilidade(elemento, visivel) {
    if (!elemento) return;
    elemento.hidden = !visivel;
    elemento.querySelectorAll("input, select, textarea").forEach(function (campo) {
      if (visivel) {
        campo.removeAttribute("disabled");
      } else {
        campo.setAttribute("disabled", "disabled");
      }
    });
  }

  function configurarTipoServidor() {
    var radios = document.querySelectorAll("[data-tipo-servidor]");
    if (radios.length === 0) return;
    var campoMunicipal = document.querySelector("[data-campo-municipal]");
    var campoEstadual = document.querySelector("[data-campo-estadual]");

    function atualizar() {
      var selecionado = document.querySelector("[data-tipo-servidor]:checked");
      var valor = selecionado ? selecionado.value : "municipal";
      alternarVisibilidade(campoMunicipal, valor === "municipal");
      alternarVisibilidade(campoEstadual, valor === "estadual");
    }

    radios.forEach(function (r) {
      r.addEventListener("change", atualizar);
    });
    atualizar();
  }

  function configurarFormacao() {
    var select = document.querySelector("[data-formacao]");
    var campoCurso = document.querySelector("[data-campo-curso]");
    if (!select || !campoCurso) return;

    function atualizar() {
      var mostrar = select.value === "tecnico" || select.value === "superior";
      alternarVisibilidade(campoCurso, mostrar);
    }

    select.addEventListener("change", atualizar);
    atualizar();
  }

  function configurarTipoCapacitacao() {
    var select = document.querySelector("[data-tipo-capacitacao]");
    var campoInstrutor = document.querySelector("[data-campo-instrutor]");
    if (!select || !campoInstrutor) return;

    function atualizar() {
      var opcao = select.options[select.selectedIndex];
      var temInstrutor = opcao ? opcao.getAttribute("data-tem-instrutor") !== "false" : true;
      alternarVisibilidade(campoInstrutor, temInstrutor);
    }

    select.addEventListener("change", atualizar);
    atualizar();
  }

  function configurarTipoPergunta() {
    var select = document.querySelector("[data-tipo-pergunta]");
    var campoOpcoes = document.querySelector("[data-campo-opcoes-pergunta]");
    if (!select || !campoOpcoes) return;

    function atualizar() {
      alternarVisibilidade(campoOpcoes, select.value === "multipla_escolha");
    }

    select.addEventListener("change", atualizar);
    atualizar();
  }

  function configurarCopiarLink() {
    document.querySelectorAll("[data-copy-link]").forEach(function (botao) {
      botao.addEventListener("click", function () {
        var link = botao.getAttribute("data-copy-link");
        if (navigator.clipboard && link) {
          navigator.clipboard.writeText(link).then(function () {
            var textoOriginal = botao.textContent;
            botao.textContent = "Link copiado!";
            setTimeout(function () {
              botao.textContent = textoOriginal;
            }, 2000);
          });
        }
      });
    });
  }

  function configurarConfirmacao() {
    document.querySelectorAll("[data-confirmar]").forEach(function (form) {
      form.addEventListener("submit", function (evento) {
        if (!window.confirm(form.getAttribute("data-confirmar"))) {
          evento.preventDefault();
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    configurarTipoServidor();
    configurarFormacao();
    configurarTipoCapacitacao();
    configurarTipoPergunta();
    configurarCopiarLink();
    configurarConfirmacao();
  });
})();
