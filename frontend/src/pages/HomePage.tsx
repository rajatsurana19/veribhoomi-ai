import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import heroBg from '../assets/hero-bg.png';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, setLanguage } = useLanguage();

  // Handle redirect to login / dashboard
  const handleOfficerLogin = () => {
    if (user) {
      if (user.role === 'officer') navigate('/officer');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/operator');
    } else {
      navigate('/login');
    }
  };

  // Scroll to in-page section smoothly
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Trilingual Content
  const content = {
    en: {
      portalTag: 'GOVERNMENT OF INDIA • DIGITAL INDIA LAND RECORDS MODERNIZATION PROGRAMME (DILRMP)',
      nationalPortal: 'National Portal',
      title: 'VeriBhoomi AI',
      subtitle: 'National Land Records & Cadastral Verification Platform',
      description: 'An intelligent, fast verification platform built for Revenue Officers, Tehsildars, and District Collectors to instantly digitize land records, verify parcel boundaries, and resolve land disputes with mathematical precision.',
      officerLoginBtn: 'Authorized Officer Login',
      exploreBtn: 'Explore Capabilities',
      liveSync: 'Central Land Registry Active',
      // Simple Things / Feature Pills
      pill1: 'Agricultural & Non-Agri Parcels',
      pill2: 'Zero-Discrepancy Area Math',
      pill3: 'Officer DSC Digital Signatures',
      pill4: 'Instant Revenue Alert Dispatch',
      // Core Capabilities
      featuresHeading: 'Core Capabilities',
      featuresSub: 'Engineered to eliminate manual transcription errors and guarantee mathematical certainty.',
      f1Title: 'Multimodal Vision OCR',
      f1Desc: 'Extracts printed tables and handwritten mutation notes with high precision using RapidOCR, TrOCR, and Tesseract.',
      f2Title: 'Automated Area Verification',
      f2Desc: 'Verifies that Total Area exactly matches Cultivable Land plus Uncultivable portions with zero calculation discrepancy.',
      f3Title: 'Officer Review & Approval',
      f3Desc: 'Two-tier verification where operators inspect flagged differences and officers approve records with digital signatures (DSC).',
      f4Title: 'Tamper-Proof Audit Trail',
      f4Desc: 'Every verification and approval is permanently logged with officer credentials and exact timestamps.',
      // Simple Workflow
      workflowHeading: 'Simple 3-Step Officer Workflow',
      workflowSub: 'Fast, accountable process from initial scan to official state register commit.',
      step1Title: 'Upload Record Scans',
      step1Desc: 'Clerk uploads archival scans of land records or mutation register entries.',
      step2Title: 'AI Inspection & Area Math',
      step2Desc: 'System extracts fields, checks area calculations, and highlights any discrepancies.',
      step3Title: 'Officer DSC Approval',
      step3Desc: 'Approving officer reviews differences, signs with DSC, and commits verified record.',
      // Tech Specs
      techHeading: 'Technical Specifications',
      techSub: 'Standardized enterprise stack built strictly under DILRMP guidelines.',
      spec1Label: 'OCR Pipeline',
      spec1Val: 'RapidOCR (Printed) + TrOCR (Handwritten) + Tesseract',
      spec2Label: 'Spatial Database',
      spec2Val: 'Supabase PostgreSQL with PostGIS Spatial Engine',
      spec3Label: 'Automation Layer',
      spec3Val: 'n8n Enterprise Webhook & Officer Dispatch',
      spec4Label: 'Compliance',
      spec4Val: 'Digital India Land Records Modernization Programme (DILRMP)',
      // CTA
      ctaTitle: 'Official Revenue Administrative Access',
      ctaDesc: 'Restricted to authorized Revenue Officers, Tehsildars, District Magistrates, and Land Record Staff.',
      ctaBtn: 'Launch Official Officer Login Portal',
      footerCopy: '© 2026 Government of India — Digital India Land Records Modernization Programme (DILRMP). Technical collaboration with National Informatics Centre (NIC).'
    },
    hi: {
      portalTag: 'भारत सरकार • डिजिटल इंडिया भू-अभिलेख आधुनिकीकरण कार्यक्रम (DILRMP)',
      nationalPortal: 'राष्ट्रीय पोर्टल',
      title: 'वेरीभूमि AI',
      subtitle: 'राष्ट्रीय भू-अभिलेख एवं भू-नक्शा सत्यापन प्रणाली',
      description: 'राजस्व अधिकारियों, तहसीलदारों और जिलाधिकारियों के लिए भू-अभिलेखों का त्वरित डिजिटलीकरण, भू-क्षेत्रफल मिलान और भूमि विवादों की रोकथाम हेतु सरल एवं विश्वसनीय समाधान।',
      officerLoginBtn: 'अधिकृत अधिकारी लॉगिन',
      exploreBtn: 'प्रमुख विशेषताएं देखें',
      liveSync: 'केंद्रीय रजिस्ट्री सक्रिय',
      // Simple Things / Feature Pills
      pill1: 'कृषि एवं अकृषि भूमि प्रमाणीकरण',
      pill2: 'शून्य-त्रुटि क्षेत्रफल मिलान',
      pill3: 'डिजिटल हस्ताक्षर (DSC) स्वीकृति',
      pill4: 'त्वरित विभागीय सूचना प्रेषण',
      // Core Capabilities
      featuresHeading: 'प्रमुख विशेषताएं',
      featuresSub: 'मानवीय त्रुटियों को समाप्त करने और राजस्व रजिस्टरों में गणितीय सटीकता सुनिश्चित करने हेतु निर्मित।',
      f1Title: 'दस्तावेज़ स्कैनिंग एवं OCR',
      f1Desc: 'मुद्रित और हस्तलिखित भू-अभिलेखों का RapidOCR, TrOCR और Tesseract द्वारा उच्च सटीकता से निष्कर्षण।',
      f2Title: 'स्वचालित क्षेत्रफल सत्यापन',
      f2Desc: 'कुल क्षेत्रफल, कृषि योग्य और अकृषि योग्य भूमि का स्वचालित गणितीय मिलान व त्वरित विसंगति पहचान।',
      f3Title: 'अधिकारी समीक्षा एवं अनुमोदन',
      f3Desc: 'दो-स्तरीय प्रक्रिया जहां कर्मचारी विसंगतियों की जांच करते हैं और अधिकारी डिजिटल हस्ताक्षर (DSC) से स्वीकृति देते हैं।',
      f4Title: 'सुरक्षित एवं अपरिवर्तनीय ऑडिट',
      f4Desc: 'प्रत्येक संशोधन और अनुमोदन अधिकारी पहचान एवं समय-मुहर के साथ डिजिटल लेज़र में सुरक्षित दर्ज होता है।',
      // Simple Workflow
      workflowHeading: 'सरल 3-चरणीय कार्यप्रणाली',
      workflowSub: 'दस्तावेज़ स्कैन से लेकर अंतिम रजिस्ट्री अनुमोदन तक पारदर्शी प्रक्रिया।',
      step1Title: '1. अभिलेख स्कैन अपलोड',
      step1Desc: 'राजस्व कर्मचारी भू-अभिलेख या नामांतरण पंजी के स्कैन अपलोड करते हैं।',
      step2Title: '2. स्वचालित OCR व क्षेत्रफल जांच',
      step2Desc: 'सिस्टम प्रविष्टियों का मिलान करता है और क्षेत्रफल अंतर को चिन्हित करता है।',
      step3Title: '3. अधिकारी DSC अनुमोदन',
      step3Desc: 'तहसीलदार या सक्षम अधिकारी विसंगतियों की समीक्षा कर डिजिटल हस्ताक्षर से अनुमोदित करते हैं।',
      // Tech Specs
      techHeading: 'तकनीकी विनिर्देश',
      techSub: 'DILRMP दिशानिर्देशों के अनुरूप निर्मित आधुनिक तकनीक।',
      spec1Label: 'OCR इंजन',
      spec1Val: 'RapidOCR (मुद्रित) + TrOCR (हस्तलिखित) + Tesseract',
      spec2Label: 'डेटाबेस व भू-स्थानिक',
      spec2Val: 'Supabase PostgreSQL एवं PostGIS इंजन',
      spec3Label: 'ऑटोमेशन प्रणाली',
      spec3Val: 'n8n वेबहुक एवं त्वरित सूचना प्रेषण',
      spec4Label: 'वैधानिक मानक',
      spec4Val: 'डिजिटल इंडिया लैंड रिकॉर्ड्स मॉडर्नाइजेशन प्रोग्राम (DILRMP)',
      // CTA
      ctaTitle: 'आधिकारिक राजस्व प्रशासनिक पोर्टल',
      ctaDesc: 'केवल अधिकृत राजस्व अधिकारियों, तहसीलदारों, जिलाधिकारियों और कर्मचारियों हेतु।',
      ctaBtn: 'आधिकारिक अधिकारी पोर्टल खोलें',
      footerCopy: '© 2026 भारत सरकार — डिजिटल इंडिया भू-अभिलेख आधुनिकीकरण कार्यक्रम (DILRMP)। राष्ट्रीय सूचना विज्ञान केंद्र (NIC) के तकनीकी सहयोग से।'
    },
    mr: {
      portalTag: 'भारत सरकार • डिजिटल इंडिया भू-अभिलेख आधुनिकीकरण कार्यक्रम (DILRMP)',
      nationalPortal: 'राष्ट्रीय पोर्टल',
      title: 'वेरीभूमी AI',
      subtitle: 'राष्ट्रीय भू-अभिलेख व भू-मापन प्रमाणीकरण प्रणाली',
      description: 'महसूल अधिकारी, तहसीलदार आणि जिल्हाधिकाऱ्यांसाठी जमीन महसूल अभिलेखांचे जलद डिजिटायझेशन, भू-मापन क्षेत्र पडताळणी आणि सीमा वाद प्रतिबंधासाठी अचूक व सोपी प्रणाली.',
      officerLoginBtn: 'अधिकृत अधिकारी लॉगिन',
      exploreBtn: 'वैशिष्ट्ये पहा',
      liveSync: 'केंद्रीय नोंदवही सक्रिय',
      // Simple Things / Feature Pills
      pill1: 'शेती व अकृषिक जमीन पडताळणी',
      pill2: 'शून्य-त्रुटी क्षेत्र ताळेबंद',
      pill3: 'डिजिटल स्वाक्षरी (DSC) कायदेशीर मंजुरी',
      pill4: 'विभागीय त्वरित सूचना वितरण',
      // Core Capabilities
      featuresHeading: 'प्रमुख वैशिष्ट्ये',
      featuresSub: 'मानवी त्रुटी दूर करण्यासाठी आणि महसूल नोंदींमध्ये अचूक गणितीय पडताळणीसाठी विकसित.',
      f1Title: 'दस्तऐवज स्कॅनिंग व OCR',
      f1Desc: 'छापील आणि हस्तलिखित महसूल नोंदींचे RapidOCR, TrOCR आणि Tesseract द्वारे अचूक वाचन.',
      f2Title: 'स्वयंचलित क्षेत्र पडताळणी',
      f2Desc: 'एकूण क्षेत्र, लागवडीयोग्य क्षेत्र आणि पोटखराब क्षेत्राचा स्वयंचलित ताळेबंद आणि विसंगती तपासणी.',
      f3Title: 'अधिकारी पडताळणी व मंजुरी',
      f3Desc: 'दोन-स्तरीय कार्यपद्धती ज्यामध्ये कर्मचारी फरक तपासतात आणि अधिकारी डिजिटल स्वाक्षरीने (DSC) मंजुरी देतात.',
      f4Title: 'अपरिवर्तनीय व सुरक्षित ऑडिट',
      f4Desc: 'प्रत्येक पडताळणी आणि मंजुरी अधिकारी ओळख व वेळेसह डिजिटल लेजरमध्ये कायमस्वरूपी सुरक्षित नोंदवली जाते.',
      // Simple Workflow
      workflowHeading: 'सोपी ३-टप्प्यांची कार्यप्रणाली',
      workflowSub: 'स्कॅन अपलोडपासून अंतिम शासकीय नोंदवही मंजुरीपर्यंत पारदर्शक प्रक्रिया.',
      step1Title: '१. अभिलेख स्कॅन अपलोड',
      step1Desc: 'महसूल कर्मचारी जमीन अभिलेख किंवा फेरफार नोंदींचे स्कॅन अपलोड करतात.',
      step2Title: '२. स्वयंचलित OCR व क्षेत्र तपासणी',
      step2Desc: 'प्रणाली नोंदी वाचते, क्षेत्राचा ताळेबंद तपासते आणि तफावत असल्यास दाखवते.',
      step3Title: '३. अधिकारी DSC स्वाक्षरी मंजुरी',
      step3Desc: 'तहसीलदार किंवा सक्षम अधिकारी फरकांचे पुनरावलोकन करून डिजिटल स्वाक्षरीने मंजुरी देतात.',
      // Tech Specs
      techHeading: 'तांत्रिक तपशील',
      techSub: 'DILRMP मार्गदर्शक तत्त्वांवर आधारित आधुनिक रचना.',
      spec1Label: 'OCR प्रणाली',
      spec1Val: 'RapidOCR (छापील) + TrOCR (हस्तलिखित) + Tesseract',
      spec2Label: 'डेटाबेस व भौगोलिक माहिती',
      spec2Val: 'Supabase PostgreSQL आणि PostGIS भू-स्थानिक इंजिन',
      spec3Label: 'ऑटोमेशन प्रणाली',
      spec3Val: 'n8n ऑटोमेशन आणि त्वरित सूचना वितरण',
      spec4Label: 'शासकीय मानके',
      spec4Val: 'डिजिटल इंडिया लँड रेकॉर्ड्स मॉडर्नायझेशन प्रोग्राम (DILRMP)',
      // CTA
      ctaTitle: 'अधिकृत शासकीय महसूल प्रशासन कक्ष',
      ctaDesc: 'केवळ अधिकृत महसूल अधिकारी, तहसीलदार, जिल्हाधिकारी आणि महसूल कर्मचाऱ्यांसाठी मर्यादित.',
      ctaBtn: 'अधिकृत अधिकारी लॉगिन पोर्टल उघडा',
      footerCopy: '© २०२६ भारत सरकार — डिजिटल इंडिया भू-अभिलेख आधुनिकीकरण कार्यक्रम (DILRMP). राष्ट्रीय सूचना विज्ञान केंद्र (NIC) सहकार्याने.'
    }
  };

  const t = content[language] || content.en;

  return (
    <div className="bg-[#F8FAFC] font-sans text-slate-900 antialiased min-h-screen flex flex-col">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION                                                */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & NAVIGATION (HARMONIOUS SOVEREIGN BLUE)                    */}
      {/* ========================================================================= */}
      <header className="fixed top-0 w-full z-50 bg-[#0A2540]/95 backdrop-blur-lg border-b border-blue-900/60 shadow-md">
        {/* Top Sovereign Ribbon */}
        <div className="bg-[#06182C] text-slate-300 py-1 px-4 sm:px-8 text-xs border-b border-blue-950">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5">
            <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-300">
              {t.portalTag}
            </p>
            {/* Language Switcher: English | हिंदी | मराठी */}
            <div className="flex items-center gap-1.5 text-slate-300 text-xs">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded transition font-medium ${
                  language === 'en' ? 'text-white bg-blue-600 font-bold shadow-xs' : 'hover:text-white hover:bg-white/10'
                }`}
              >
                English
              </button>
              <span className="opacity-30">|</span>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 rounded transition font-medium ${
                  language === 'hi' ? 'text-white bg-blue-600 font-bold shadow-xs' : 'hover:text-white'
                }`}
              >
                हिंदी
              </button>
              <span className="opacity-30">|</span>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2 py-0.5 rounded transition font-medium ${
                  language === 'mr' ? 'text-white bg-blue-600 font-bold shadow-xs' : 'hover:text-white'
                }`}
              >
                मराठी
              </button>
            </div>
          </div>
        </div>

        {/* Main Navbar in Cohesive Sovereign Blue */}
        <div className="h-16 max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 p-1.5 flex items-center justify-center shadow-md border border-blue-400/30">
              <svg viewBox="0 0 24 24" className="w-full h-full text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg text-white tracking-tight font-extrabold">
                  {t.title}
                </span>
                <span className="bg-blue-800/80 text-blue-200 text-[10px] font-bold px-1.5 py-0.2 rounded border border-blue-500/40">
                  {t.nationalPortal}
                </span>
              </div>
              <span className="text-[11px] text-blue-200/90 font-medium hidden sm:inline-block">
                {t.subtitle}
              </span>
            </div>
          </div>

          {/* Quick Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-blue-100">
            <button
              onClick={() => scrollToSection('features')}
              className="px-3 py-1.5 rounded-md hover:bg-white/10 hover:text-white transition"
            >
              {t.featuresHeading}
            </button>
            <button
              onClick={() => scrollToSection('workflow')}
              className="px-3 py-1.5 rounded-md hover:bg-white/10 hover:text-white transition"
            >
              {language === 'mr' ? 'कार्यप्रणाली' : language === 'hi' ? 'कार्यप्रणाली' : 'Workflow'}
            </button>
            <button
              onClick={() => scrollToSection('specs')}
              className="px-3 py-1.5 rounded-md hover:bg-white/10 hover:text-white transition"
            >
              {t.techHeading}
            </button>
          </nav>

          {/* Officer Login Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOfficerLogin}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md border border-blue-400/40 transition"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-300">verified_user</span>
              <span>{t.officerLoginBtn}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="w-full pt-24 flex flex-col">
        {/* ========================================================================= */}
        {/* 2. AUTHENTIC APPLE-STYLE LIQUID GLASSMORPHISM HERO                        */}
        {/* ========================================================================= */}
        <section
          className="relative w-full overflow-hidden bg-cover bg-center py-16 sm:py-24 border-b border-slate-200"
          style={{ backgroundImage: `url(${heroBg})` }}
        >
          {/* Ambient soft diffuser across landscape to prevent harsh color splits */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/10 to-slate-900/20 backdrop-blur-[2px] pointer-events-none"></div>

          {/* Centered Liquid Apple Glassmorphism Card */}
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
            <div
              className="relative overflow-hidden rounded-3xl p-8 sm:p-12 flex flex-col items-center text-center gap-5 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.58) 0%, rgba(255, 255, 255, 0.38) 50%, rgba(255, 255, 255, 0.48) 100%)',
                backdropFilter: 'blur(28px) saturate(180%)',
                WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                border: '1.5px solid rgba(255, 255, 255, 0.75)',
                boxShadow: '0 25px 50px -12px rgba(10, 37, 64, 0.25), inset 0 1.5px 2px rgba(255, 255, 255, 0.95), inset 0 -1px 1px rgba(255, 255, 255, 0.3)'
              }}
            >
              {/* Apple Specular Bevel Top Highlight */}
              <div className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent"></div>

              {/* Ambient Liquid Back-Reflection */}
              <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-white/30 rounded-full blur-3xl"></div>

              {/* Live Sync Badge in Liquid Glass */}
              <div
                className="relative z-10 inline-flex items-center gap-2 px-4 py-1.2 rounded-full text-xs font-bold text-[#0A2540] shadow-2xs"
                style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.85)'
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t.liveSync}</span>
              </div>

              {/* Main Headline */}
              <h1 className="relative z-10 text-2xl sm:text-4xl lg:text-5xl text-[#0A2540] tracking-tight font-black leading-tight drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]">
                {t.title}: <span className="text-[#1E40AF]">{t.subtitle}</span>
              </h1>

              {/* Concise Description */}
              <p className="relative z-10 text-sm sm:text-base text-slate-800 max-w-2xl leading-relaxed font-medium drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
                {t.description}
              </p>

              {/* Action Buttons */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleOfficerLogin}
                  className="inline-flex items-center gap-2 bg-[#0A2540] hover:bg-[#1E40AF] text-white text-sm font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition border border-white/20"
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-300">badge</span>
                  <span>{t.officerLoginBtn}</span>
                </button>
                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center gap-1.5 text-slate-900 text-sm font-bold px-5 py-3.5 rounded-xl transition shadow-sm hover:shadow"
                  style={{
                    background: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.85)'
                  }}
                >
                  <span>{t.exploreBtn}</span>
                  <span className="material-symbols-outlined text-[16px] text-blue-900">arrow_downward</span>
                </button>
              </div>

              {/* Simple Feature Pills in Liquid Glass Style */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 pt-5 border-t border-white/40 w-full">
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-2xs hover:bg-white/80 transition"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <span className="text-emerald-700 font-black">✓</span>
                  <span>{t.pill1}</span>
                </div>
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-2xs hover:bg-white/80 transition"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <span className="text-blue-700 font-black">✓</span>
                  <span>{t.pill2}</span>
                </div>
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-2xs hover:bg-white/80 transition"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <span className="text-amber-700 font-black">✓</span>
                  <span>{t.pill3}</span>
                </div>
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-800 shadow-2xs hover:bg-white/80 transition"
                  style={{
                    background: 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <span className="text-purple-700 font-black">✓</span>
                  <span>{t.pill4}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. 4 CORE CAPABILITIES                                                    */}
        {/* ========================================================================= */}
        <section className="w-full bg-[#F8FAFC] px-4 sm:px-8 py-12 md:py-16 border-b border-slate-200" id="features">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl text-slate-900 font-bold font-heading">
                {t.featuresHeading}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t.featuresSub}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">document_scanner</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-900">{t.f1Title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{t.f1Desc}</p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">calculate</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-900">{t.f2Title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{t.f2Desc}</p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">how_to_reg</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-900">{t.f3Title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{t.f3Desc}</p>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[22px]">fingerprint</span>
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-900">{t.f4Title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{t.f4Desc}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. 3-STEP OFFICER WORKFLOW                                                */}
        {/* ========================================================================= */}
        <section className="w-full bg-white px-4 sm:px-8 py-12 md:py-16 border-b border-slate-200" id="workflow">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl text-slate-900 font-bold font-heading">
                {t.workflowHeading}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                {t.workflowSub}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Step 1 */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-2xs">
                <span className="w-7 h-7 rounded-full bg-blue-900 text-white text-xs font-bold flex items-center justify-center">
                  1
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{t.step1Title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t.step1Desc}</p>
              </div>

              {/* Step 2 */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-2xs">
                <span className="w-7 h-7 rounded-full bg-blue-700 text-white text-xs font-bold flex items-center justify-center">
                  2
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{t.step2Title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t.step2Desc}</p>
              </div>

              {/* Step 3 */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col gap-2 shadow-2xs">
                <span className="w-7 h-7 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">
                  3
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{t.step3Title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{t.step3Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. TECHNICAL SPECIFICATIONS (CONCISE)                                      */}
        {/* ========================================================================= */}
        <section className="w-full bg-[#F8FAFC] px-4 sm:px-8 py-10 border-b border-slate-200" id="specs">
          <div className="max-w-4xl mx-auto flex flex-col gap-5">
            <div>
              <h2 className="text-xl sm:text-2xl text-slate-900 font-bold font-heading">
                {t.techHeading}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {t.techSub}
              </p>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs text-xs">
              <div className="divide-y divide-slate-100">
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-slate-800">{t.spec1Label}</span>
                  <span className="font-mono text-slate-600">{t.spec1Val}</span>
                </div>
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-50/50">
                  <span className="font-semibold text-slate-800">{t.spec2Label}</span>
                  <span className="font-mono text-slate-600">{t.spec2Val}</span>
                </div>
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-semibold text-slate-800">{t.spec3Label}</span>
                  <span className="font-mono text-slate-600">{t.spec3Val}</span>
                </div>
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-50/50">
                  <span className="font-semibold text-slate-800">{t.spec4Label}</span>
                  <span className="text-slate-600">{t.spec4Val}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. RESTRICTED GOVERNMENT ADMINISTRATIVE ACCESS SECTION                    */}
        {/* ========================================================================= */}
        <section className="w-full bg-[#0A2540] text-white px-4 sm:px-8 py-10" id="officer-login">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col gap-1.5 text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl text-white font-bold font-heading">
                {t.ctaTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {t.ctaDesc}
              </p>
            </div>

            <button
              onClick={handleOfficerLogin}
              className="shrink-0 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-lg shadow-sm transition"
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              <span>{t.ctaBtn}</span>
            </button>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 7. FOOTER                                                                 */}
      {/* ========================================================================= */}
      <footer className="w-full bg-slate-100 py-6 border-t border-slate-200 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p>{t.footerCopy}</p>
          <div className="flex items-center gap-4 text-slate-600">
            <span className="hover:text-slate-900 transition cursor-pointer">Privacy</span>
            <span className="hover:text-slate-900 transition cursor-pointer">Terms</span>
            <span className="hover:text-slate-900 transition cursor-pointer">Security</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
