import {Paper, Stack} from "@mui/material";
import React from "react";

export function LayoutMain({children}: any) {
  // @ts-ignore
  return (
    <Stack alignItems="center"
           sx={{flex: 1, width: '100vw', height: "100vh", maxWidth: "400px", marginX: 'auto', paddingY: "20px"}}>
      <Paper sx={{
        padding: 2,
        overflowX: 'scroll',
        width: "100%",
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {children}
      </Paper>
    </Stack>
  );
}