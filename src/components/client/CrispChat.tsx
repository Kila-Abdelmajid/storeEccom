'use client'; // Darori hit l-chat widget kiy-khdem ghir f l-browser

import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CrispChat = () => {
  useEffect(() => {
    // Blast "VOTRE_WEBSITE_ID" 7et ghir dak l-koud sghir li fih les chiffres w les lettres
    // Masalan: "1234abcd-5678-efgh..."
    Crisp.configure("35e78f99-6978-4deb-b5cc-2a739548c918");
    
  }, []);

  return null; // May-ban fih walou hit l-widget kiy-tla3 rrassou l-te7t
};

export default CrispChat;

