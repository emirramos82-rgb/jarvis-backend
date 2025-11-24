import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// Endpoint principal para Alexa
app.post("/", async (req, res) => {
  try {
    const request = req.body;

    // Extraer el mensaje capturado por Alexa
    const mensaje = request.request?.intent?.slots?.mensaje?.value || "";

    // Cuando Alexa abre la skill
    if (request.request.type === "LaunchRequest") {
      return res.json(
        buildResponse("Hola, soy Jarvis desde Render. ¿Qué deseas preguntar?")
      );
    }

    // Cuando el usuario hace una pregunta
    if (
      request.request.type === "IntentRequest" &&
      request.request.intent.name === "AskGPTIntent"
    ) {
      const respuesta = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Eres Jarvis, un asistente amable, claro y rápido respondiendo en español."
              },
              { role: "user", content: mensaje }
            ],
            max_tokens: 200
          })
        }
      );

      const data = await respuesta.json();
      const texto =
        data.choices?.[0]?.message?.content ||
        "Lo siento, no pude generar una respuesta.";

      return res.json(buildResponse(texto));
    }

    return res.json(buildResponse("No entendí tu consulta."));
  } catch (error) {
    console.error(error);
    return res.json(buildResponse("Ocurrió un error interno."));
  }
});

// Función para formatear la respuesta para Alexa
function buildResponse(texto) {
  return {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "PlainText",
        text: texto
      },
      shouldEndSession: false
    }
  };
}

// Puerto asignado por Render
const port = process.env.PORT || 10000;
app.listen(port, () =>
  console.log("Jarvis API corriendo en el puerto:", port)
);
