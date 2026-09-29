import {
  Box,
  InputAdornment,
  TextField,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

const ChatSearch = ({
  value = "",
  onChange,
}) => {
  return (
    <Box
      sx={{
        px: 2,
        pt: 2,
        pb: 1.2,
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Buscar conversación..."
        value={value}
        onChange={(event) =>
          onChange?.(
            event.target.value
          )
        }
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default ChatSearch;