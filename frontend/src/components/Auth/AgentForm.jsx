import React from 'react';
import {
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Tooltip,
  Box,
  Collapse
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import styles from './CreateAgent.module.css';

export default function AgentForm({ botType, setBotType }) {
  return (
    <Box>
      <Typography variant="h6" className={styles.sectionTitle}>
        Choose Agent Type
      </Typography>

      <RadioGroup value={botType} onChange={(e) => setBotType(e.target.value)} className={styles.radioGroup}>
        <FormControlLabel
          value="chatbot"
          control={<Radio />}
          label="🤖 Chatbot (PDF-based Assistant)"
          className={`${styles.radioOption} ${botType === 'chatbot' ? styles.selected : ''}`}
        />
        <FormControlLabel
          value="searchbot"
          control={<Radio />}
          label="🔍 Searchbot (Database Explorer)"
          className={`${styles.radioOption} ${botType === 'searchbot' ? styles.selected : ''}`}
        />
      </RadioGroup>

      <Collapse in={botType === 'chatbot'} timeout={300}>
        <Box mt={3}>
          <Typography variant="h6" className={`${styles.sectionTitle} ${styles.inlineIcon}`}>
            Data Source
            <Tooltip
              title="Chatbot agents use PDF files to train the assistant's knowledge base."
              arrow
              placement="right"
            >
              <InfoOutlinedIcon fontSize="small" sx={{ ml: 1, color: '#00d0ff', cursor: 'pointer' }} />
            </Tooltip>
          </Typography>
          <Box ml={3} mt={1}>
            <Typography variant="body1" className={styles.textMuted}>
              📄 Upload PDF (required)
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
