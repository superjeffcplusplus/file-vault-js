import React from 'react';
import './App.css';
import {LayoutMain} from "./components/LayoutMain";
import {Register} from "./components/Register";
import {Login} from "./components/Login";
import {BrowserRouter, Routes, Route} from "react-router-dom";
import Account from "./components/Account";
import AddFile from "./components/AddFile";
import FileList from "./components/FileList";
import Home from "./components/Home";
export default function App() {
  return (
    <BrowserRouter>
      <LayoutMain>
        <Routes>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/register" element={<Register/>}></Route>
          <Route path="/filelist" element={<FileList/>}></Route>
          <Route path="/login" element={<Login/>}></Route>
          <Route path="/account" element={<Account/>}></Route>
          <Route path="/addfile" element={<AddFile/>}></Route>
        </Routes>
      </LayoutMain>
    </BrowserRouter>
  );
}

