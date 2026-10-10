'use client'; // Darori hit l-chat widget kiy-khdem ghir f l-browser

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CrispChat = () => {
  useEffect(() => {
    // Blast "VOTRE_WEBSITE_ID" 7et ghir dak l-koud sghir li fih les chiffres w les lettres
    // Masalan: "1234abcd-5678-efgh..."
    Crisp.configure("b0ab38f9-171c-4e9f-ba62-f3492ab64ae2");
    
  }, []);

  return null; // May-ban fih walou hit l-widget kiy-tla3 rrassou l-te7t
};

export default CrispChat;

