import {
  Box,
  CircularProgress,
  ClickAwayListener,
  Divider,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";

import SendIcon from "@mui/icons-material/Send";
import InsertEmoticonOutlinedIcon from "@mui/icons-material/InsertEmoticonOutlined";

import EmojiPicker from "emoji-picker-react";

import { useEffect, useRef, useState } from "react";

// ============================================================
// COMPONENTE
// ============================================================

const MessageInput = ({
  value,
  enviando,
  onChange,
  onSend,
}) => {
  // ============================================================
  // ESTADOS
  // ============================================================

  const [mostrarEmojis, setMostrarEmojis] =
    useState(false);

  const inputRef = useRef(null);

  // ============================================================
  // DEVOLVER FOCUS AL INPUT
  // ============================================================

  const enfocarInput = () => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // ============================================================
  // RECUPERAR FOCUS DESPUÉS DE ENVIAR
  // ============================================================

  useEffect(() => {
    if (enviando) {
      return;
    }

    const timeout = setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    return () => {
      clearTimeout(timeout);
    };
  }, [enviando]);

  // ============================================================
  // CERRAR EMOJIS
  // ============================================================

  const cerrarEmojis = () => {
    setMostrarEmojis(false);

    enfocarInput();
  };

  // ============================================================
  // ENTER PARA ENVIAR
  // SHIFT + ENTER PARA SALTO DE LÍNEA
  // ============================================================

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (
        !enviando &&
        value.trim()
      ) {
        setMostrarEmojis(false);

        onSend();
      }
    }
  };

  // ============================================================
  // ABRIR / CERRAR SELECTOR DE EMOJIS
  // ============================================================

  const handleToggleEmojis = () => {
    if (enviando) {
      return;
    }

    // ----------------------------------------------------------
    // SI ESTÁ ABIERTO, CERRAR Y REGRESAR AL INPUT
    // ----------------------------------------------------------

    if (mostrarEmojis) {
      cerrarEmojis();
      return;
    }

    // ----------------------------------------------------------
    // ABRIR SELECTOR
    // ----------------------------------------------------------

    setMostrarEmojis(true);
  };

  // ============================================================
  // SELECCIONAR EMOJI
  // ============================================================

  const handleEmojiClick = (
    emojiData,
  ) => {
    const emoji =
      emojiData?.emoji;

    if (!emoji) {
      return;
    }

    // ----------------------------------------------------------
    // OBTENER POSICIÓN ACTUAL DEL CURSOR
    // ----------------------------------------------------------

    const input =
      inputRef.current;

    const inicio =
      input?.selectionStart ??
      value.length;

    const fin =
      input?.selectionEnd ??
      value.length;

    // ----------------------------------------------------------
    // INSERTAR EMOJI EN LA POSICIÓN DEL CURSOR
    // ----------------------------------------------------------

    const nuevoValor =
      value.slice(0, inicio) +
      emoji +
      value.slice(fin);

    onChange(nuevoValor);

    // ----------------------------------------------------------
    // NUEVA POSICIÓN DEL CURSOR
    // ----------------------------------------------------------

    const nuevaPosicion =
      inicio + emoji.length;

    // ----------------------------------------------------------
    // REGRESAR CURSOR AL INPUT
    //
    // NO cerramos el picker para permitir:
    // 😂😂😂❤️🔥
    // ----------------------------------------------------------

    setTimeout(() => {
      if (!input) {
        return;
      }

      input.focus();

      input.setSelectionRange(
        nuevaPosicion,
        nuevaPosicion,
      );
    }, 0);
  };

  // ============================================================
  // ENVIAR DESDE BOTÓN
  // ============================================================

  const handleEnviarClick = () => {
    if (
      enviando ||
      !value.trim()
    ) {
      return;
    }

    setMostrarEmojis(false);

    onSend();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <>
      <Divider />

      <ClickAwayListener
        onClickAway={() => {
          if (mostrarEmojis) {
            cerrarEmojis();
          }
        }}
      >
        <Box
          sx={{
            position: "relative",

            p: 1.5,

            display: "flex",

            alignItems: "flex-end",

            gap: 1,

            backgroundColor:
              "#ffffff",
          }}
        >
          {/* ==================================================
              SELECTOR DE EMOJIS
          ================================================== */}

          {mostrarEmojis && (
            <Box
              sx={{
                position: "absolute",

                left: 12,

                bottom:
                  "calc(100% + 8px)",

                zIndex: 1500,

                boxShadow:
                  "0 8px 30px rgba(0, 0, 0, 0.18)",

                borderRadius: 2,

                overflow: "hidden",

                // Evita que se salga del panel
                maxWidth:
                  "calc(100vw - 32px)",
              }}
            >
              <EmojiPicker
                onEmojiClick={
                  handleEmojiClick
                }
                width={330}
                height={400}
                searchPlaceholder="Buscar emoji..."
                previewConfig={{
                  showPreview: false,
                }}
              />
            </Box>
          )}

          {/* ==================================================
              BOTÓN EMOJIS
          ================================================== */}

          <Tooltip
            title={
              mostrarEmojis
                ? "Cerrar emojis"
                : "Emojis"
            }
            placement="top"
          >
            <span>
              <IconButton
                onClick={
                  handleToggleEmojis
                }
                disabled={enviando}
                aria-label={
                  mostrarEmojis
                    ? "Cerrar selector de emojis"
                    : "Seleccionar emoji"
                }
                sx={{
                  width: 42,
                  height: 42,

                  flexShrink: 0,

                  color:
                    mostrarEmojis
                      ? "#1565a8"
                      : "#667085",

                  backgroundColor:
                    mostrarEmojis
                      ? "#eef4f8"
                      : "transparent",

                  "&:hover": {
                    backgroundColor:
                      "#eef4f8",

                    color:
                      "#1565a8",
                  },
                }}
              >
                <InsertEmoticonOutlinedIcon />
              </IconButton>
            </span>
          </Tooltip>

          {/* ==================================================
              CAMPO DE MENSAJE
          ================================================== */}

          <TextField
            fullWidth
            multiline
            maxRows={4}
            size="small"
            placeholder="Escribe un mensaje..."
            value={value}
            disabled={enviando}
            inputRef={inputRef}
            onChange={(event) =>
              onChange(
                event.target.value,
              )
            }
            onKeyDown={
              handleKeyDown
            }
            sx={{
              "& .MuiOutlinedInput-root":
                {
                  borderRadius: 2,

                  fontFamily:
                    "Montserrat, sans-serif",

                  backgroundColor:
                    "#ffffff",
                },
            }}
          />

          {/* ==================================================
              BOTÓN ENVIAR
          ================================================== */}

          <IconButton
            onClick={
              handleEnviarClick
            }
            disabled={
              enviando ||
              !value.trim()
            }
            aria-label="Enviar mensaje"
            sx={{
              width: 42,
              height: 42,

              flexShrink: 0,

              backgroundColor:
                "#1565a8",

              color: "#ffffff",

              "&:hover": {
                backgroundColor:
                  "#0f527f",
              },

              "&.Mui-disabled": {
                backgroundColor:
                  "#d9dde2",

                color: "#ffffff",
              },
            }}
          >
            {enviando ? (
              <CircularProgress
                size={20}
                sx={{
                  color:
                    "#ffffff",
                }}
              />
            ) : (
              <SendIcon />
            )}
          </IconButton>
        </Box>
      </ClickAwayListener>
    </>
  );
};

export default MessageInput;