"use client";

import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { createContext, useState, useRef } from "react";
import { storage } from "@/app/firebaseCom/page";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "react-toastify";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/app/firebaseCom/page";
import { useRouter } from "next/navigation";
import "react-toastify/dist/ReactToastify.css";

const MyContextData = createContext();

export default function ContextData({ children }) {
  const [formData, setFormData] = useState({
    institutionName: "Futurelabs",
    certificationStatement: "",
    studentName: "",
    programStatement: "",
    dateOfIssue: "",
    trainName: "",
    identifier: "",
    ceoSignature: null,
    certBarcode: null,
    mgrSignature: null,
    logo: null,
  });
  console.log(formData);
  const route = useRouter();

  const [isLogoUploaded, setIsLogoUploaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const logoInputRef = useRef(null);
  const ceoSignatureInputRef = useRef(null);
  const certBarcodeInputRef = useRef(null);
  const mgrSignatureInputRef = useRef(null);
  const currentRef = useRef(null);

  const handleIconClick = (inputRef) => {
    inputRef.current.click();
  };
  // const handleChangeFile = (e) => {
  //   const { name } = e.target;
  //   const file = e.target.files[0];

  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setFormData((prevData) => ({ ...prevData, [name]: reader.result }));
  //     };
  //     reader.readAsDataURL(file);
  //     setIsLogoUploaded(true);
  //   }
  // };

  const handleChangeFile = (e) => {
    const { name } = e.target;
    const file = e.target.files[0];
    if (
      file &&
      file.type.startsWith("image/") &&
      file.size <= 2 * 1024 * 1024
    ) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prevData) => ({ ...prevData, [name]: reader.result }));
      };
      reader.readAsDataURL(file);
    } else {
      toast.error("Invalid file. Please upload an image under 2MB.", {
        theme: "dark",
      });
    }
  };

  const handleChangeText = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };
  
  const handleDownload = async () => {
    const input = currentRef.current;

    if (!input) {
      toast.error("❌ No element found for PDF generation.", { theme: "dark" });
      return;
    }

    const {
      institutionName,
      certificationStatement,
      studentName,
      programStatement,
      dateOfIssue,
      identifier,
      ceoSignature,
      certBarcode,
      mgrSignature,
      logo,
    } = formData;

    if (
      !institutionName ||
      !certificationStatement ||
      !studentName ||
      !programStatement ||
      !dateOfIssue ||
      !identifier ||
      !logo ||
      !ceoSignature ||
      !certBarcode ||
      !mgrSignature
    ) {
      toast.error("Please fill all the required text fields.", {
        theme: "dark",
      });
      return;
    }

    setLoading(true);

    try {
      const canvas = await html2canvas(input, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      pdf.addImage(imgData, "PNG", 0, 0, 297, 210);
      pdf.save("certificate.pdf");

      // Reset form data properly
      setFormData({
        institutionName: "",
        certificationStatement: "",
        studentName: "",
        programStatement: "",
        dateOfIssue: "",
        identifier: "",
        ceoSignature: null,
        certBarcode: null,
        mgrSignature: null,
        logo: null,
      });
    } catch (error) {
      console.error("Error generating PDF: ", error);
      toast.error("❌ Failed to generate the PDF. Please try again.", {
        theme: "dark",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    const {
      institutionName,
      certificationStatement,
      studentName,
      programStatement,
      dateOfIssue,
      identifier,
    } = formData;

    if (
      institutionName &&
      certificationStatement &&
      studentName &&
      programStatement &&
      dateOfIssue &&
      identifier
    ) {
      setLoading(true);
      try {
        const docRef = doc(db, "certificates", identifier.toString());
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const existingData = docSnap.data().entries || [];
          console.log("Existing data:", existingData);
          toast.info("Identifier found! Displaying existing data.", {
            theme: "light",
          });
          route.push("preview");
        } else {
          await setDoc(docRef, { entries: [formData] });
          toast.success("Data saved and ready for preview!", {
            theme: "light",
          });

          route.push("preview");
        }
      } catch (error) {
        toast.error("Error accessing database", {
          theme: "light",
        });
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Please fill in all required fields before previewing", {
        theme: "light",
      });
    }
  };

  const handleDownloadToPrev = () => {
    toast.error("please preview the certificate first", {
      theme: "dark",
    });
  };

  const fetchDataByIdentifier = async (identifier) => {
    try {
      const docRef = doc(db, "certificates", identifier.toString());
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().entries || [];
      } else {
        throw new Error("Identifier not found");
      }
    } catch (error) {
      console.error("Error fetching data:", error.message);
      toast.error(`Error: ${error.message}`, { theme: "light" });
    }
  };
  // this is for geting the details and display
  const handleRetrievePreview = async () => {
    const data = await fetchDataByIdentifier(formData.identifier);
    if (data) {
      console.log("Retrieved data:", data);
      setFormData((prevData) => ({
        ...prevData,
        ...data[0],
      }));
    }
  };

  const Values = {
    handleDownload,
    handleDownloadToPrev,
    currentRef,
    formData,
    setFormData,
    handleChangeText,
    handleChangeFile,
    handleIconClick,
    logoInputRef,
    ceoSignatureInputRef,
    certBarcodeInputRef,
    mgrSignatureInputRef,
    isLogoUploaded,
    loading,
    setLoading,
    handlePreview,
    handleRetrievePreview,
  };

  return (
    <MyContextData.Provider value={Values}>{children}</MyContextData.Provider>
  );
}

export { MyContextData };
