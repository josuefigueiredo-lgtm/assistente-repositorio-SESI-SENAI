from flask import Flask, request, jsonify, send_file
from docxtpl import DocxTemplate
import os
import uuid

app = Flask(__name__)

MODELO = os.path.join(
    os.path.dirname(__file__),
    "arquivo de referência-modelo.docx"
)


@app.route("/gerar-pdf", methods=["POST"])
def gerar_pdf():

    try:
        dados = request.json

        if not dados:
            return jsonify({
                "sucesso": False,
                "erro": "Nenhum dado foi recebido."
            }), 400

        # Carrega o modelo Word
        documento = DocxTemplate(MODELO)

        # Dados que serão enviados para o modelo
        contexto = {
    "data": dados.get("data", ""),
    "unidade_curricular": dados.get("unidade_curricular", ""),
    "docente": dados.get("docente", ""),
    "curso": dados.get("curso", ""),
    "turma": dados.get("turma", ""),
    "conteudo": dados.get("conteudo", ""),
    "desenvolvimento": dados.get("desenvolvimento", "")
}

        # Preenche os campos
        documento.render(contexto)

        # Nome temporário do arquivo
        nome_arquivo = f"roteiro_{uuid.uuid4().hex}.docx"

        caminho_saida = os.path.join(
            os.path.dirname(__file__),
            nome_arquivo
        )

        # Salva o Word preenchido
        documento.save(caminho_saida)

        print("\n==========================================")
        print("DOCUMENTO GERADO COM SUCESSO")
        print("==========================================")
        print(caminho_saida)
        print("==========================================\n")

        return send_file(
            caminho_saida,
            as_attachment=True,
            download_name="roteiro_estudo_semanal.docx"
        )

    except Exception as erro:

        print("\nERRO:")
        print(str(erro))

        return jsonify({
            "sucesso": False,
            "erro": str(erro)
        }), 500


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )