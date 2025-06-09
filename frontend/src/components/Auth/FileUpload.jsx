// ✅ File: FileUpload.jsx (updated for multiple PDF/XML files)
import React, { useRef } from 'react';
import { Box, Typography, Button, IconButton, Chip } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import styles from './CreateAgent.module.css';

export default function FileUpload({ botType, pdfFile, setPdfFile, formData, handleChange }) {
  const fileInputRef = useRef(null);

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files).filter(
      (file) => file.type === 'application/pdf' || file.name.endsWith('.xml')
    );
    
    // Combine existing files with new files
    setPdfFile(prevFiles => [...(prevFiles || []), ...newFiles]);
    
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleRemoveFile = (indexToRemove) => {
    setPdfFile(prevFiles => prevFiles.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start" gap={3} mt={4}>
      {botType === 'chatbot' ? (
        <>
          <Typography variant="h5" fontWeight="bold" className={styles.sectionTitle}>
            📄 Upload PDF or XML
          </Typography>

          <input
            type="file"
            accept=".pdf,.xml"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={handleFileClick}
            className={styles.fileButton}
          >
            Choose Files (PDF/XML)
          </Button>

          {pdfFile?.length > 0 && (
            <Box mt={2} width="100%">
              <Typography variant="subtitle2" color="textSecondary" mb={1}>
                Selected Files:
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {pdfFile.map((file, idx) => (
                  <Box
                    key={idx}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    className={styles.fileItem}
                  >
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(idx)}
                      className={styles.deleteFileButton}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <Chip
                      label={file.name}
                      variant="outlined"
                      className={styles.fileChip}
                      icon={<UploadFileIcon />}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </>
      ) : (
        <>
          <Typography variant="h6" className={styles.sectionTitle}>
            🛠️ Enter Database Credentials
          </Typography>

          {['db_host', 'db_name', 'db_user', 'db_pass'].map((field) => (
            <input
              key={field}
              type={field === 'db_pass' ? 'password' : 'text'}
              name={field}
              placeholder={field.replace('_', ' ').toUpperCase()}
              value={formData[field]}
              onChange={handleChange}
              className={styles.inputField}
            />
          ))}
        </>
      )}
    </Box>
  );
}
