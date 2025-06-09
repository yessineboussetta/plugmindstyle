// src/components/TableSelector.jsx
import React, { useState, useEffect } from "react";
import Select from "react-select";
import { Typography, Box, Button } from "@mui/material";
import styles from './CreateAgent.module.css';

export default function TableSelector({ tables = [], onConfirm }) {
  const [selected, setSelected] = useState([]);

  const options = Array.isArray(tables)
    ? tables.map((t) => ({ label: t, value: t }))
    : [];

  const handleSubmit = () => {
    const selectedValues = selected.map((item) => item.value);
    onConfirm(selectedValues); // send selected table names to parent
  };

  return (
  <Box display="flex" flexDirection="column" gap={3}>
    <Typography variant="h6" className={styles.sectionTitle}>
      Select Tables
    </Typography>

    <Select
      isMulti
      options={options}
      value={selected}
      onChange={(val) => setSelected(val)}
      placeholder="Pick tables to allow access…"
      classNamePrefix="tableSelect"
    />

    <Button
      variant="contained"
      onClick={handleSubmit}
      className={styles.fileButton}
      style={{ width: '200px', marginTop: '1rem' }}
    >
      ➕ Confirm Selection
    </Button>
  </Box>
);


}
