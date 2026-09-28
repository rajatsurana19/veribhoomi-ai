import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

export const TRANSLATIONS: Translations = {
  // Top Govt Strip & Branding
  govIndia: { en: 'Government of India', hi: 'भारत सरकार', mr: 'भारत सरकार' },
  govSubtitle: { en: 'Digital Governance & Land Records Management System', hi: 'डिजिटल शासन एवं भू-अभिलेख प्रबंधन प्रणाली', mr: 'डिजिटल शासन आणि भू-अभिलेख व्यवस्थापन प्रणाली' },
  govServiceTag: { en: 'Government Digital Service Interface', hi: 'सरकारी डिजिटल सेवा इंटरफ़ेस', mr: 'शासकीय डिजिटल सेवा प्रणाली' },
  appName: { en: 'VeriBhoomi AI', hi: 'वेरीभूमि AI', mr: 'वेरीभूमी AI' },
  appSubtitle: { en: 'Land Records Digitization & Verification System', hi: 'भू-अभिलेख डिजिटलीकरण एवं सत्यापन प्रणाली', mr: 'जमीन महसूल डिजिटलीकरण व पडताळणी प्रणाली' },
  officialPortal: { en: 'Official Land Records Portal', hi: 'आधिकारिक भू-अभिलेख पोर्टल', mr: 'अधिकृत भू-अभिलेख पोर्टल' },

  // Accessibility
  fontSize: { en: 'Font Size', hi: 'अक्षर आकार', mr: 'फॉन्ट आकार' },
  decreaseFont: { en: 'A-', hi: 'A-', mr: 'A-' },
  normalFont: { en: 'A', hi: 'A', mr: 'A' },
  increaseFont: { en: 'A+', hi: 'A+', mr: 'A+' },

  // Navigation & Roles
  operatorWorkspace: { en: 'Operator Workspace', hi: 'ऑपरेटर कार्यक्षेत्र', mr: 'ऑपरेटर कार्यक्षेत्र' },
  officerApprovals: { en: 'Officer Approvals', hi: 'अधिकारी अनुमोदन', mr: 'अधिकारी मंजुरी' },
  officerWorkspace: { en: 'Officer Review Workspace', hi: 'अधिकारी समीक्षा कार्यक्षेत्र', mr: 'अधिकारी पडताळणी कार्यक्षेत्र' },
  executiveAnalytics: { en: 'Admin Analytics', hi: 'प्रशासन विश्लेषण', mr: 'प्रशासकीय विश्लेषण' },
  gisMap: { en: 'Cadastral GIS Map', hi: 'भू-नक्शा जीआईएस', mr: 'भू-नकाशा जीआयएस' },
  auditLogs: { en: 'Audit Ledger', hi: 'ऑडिट लेजर', mr: 'ऑडिट नोंदी' },
  dashboard: { en: 'Dashboard', hi: 'डैशबोर्ड', mr: 'डॅशबोर्ड' },
  uploadDocuments: { en: 'Upload Records', hi: 'अभिलेख अपलोड करा', mr: 'अभिलेख अपलोड करा' },
  approvalQueue: { en: 'Approval Queue', hi: 'स्वीकृति कतार', mr: 'मंजुरी रांग' },
  logout: { en: 'Logout', hi: 'लॉग आउट', mr: 'बाहेर पडा' },
  activeWorkspace: { en: 'Active Role', hi: 'सक्रिय पद', mr: 'सक्रिय पद' },
  operatorControls: { en: 'Operator Services', hi: 'ऑपरेटर सेवाएं', mr: 'ऑपरेटर सेवा' },
  administration: { en: 'Administration Services', hi: 'प्रशासन सेवाएं', mr: 'प्रशासन सेवा' },
  notifications: { en: 'Notifications', hi: 'सूचनाएं', mr: 'सूचना' },
  alertsCount: { en: 'alerts', hi: 'सूचनाएं', mr: 'सूचना' },
  noActiveNotifs: { en: 'No active notifications', hi: 'कोई सक्रिय सूचना नहीं है', mr: 'कोणतीही सक्रिय सूचना नाही' },

  // Login Page
  officialLoginHeading: { en: 'Official Login', hi: 'आधिकारिक लॉगिन', mr: 'अधिकृत प्रवेश' },
  officialLoginSubheading: { en: 'Authorized Revenue Staff & Department Officers', hi: 'अधिकृत राजस्व कर्मचारी एवं विभागीय अधिकारी', mr: 'अधिकृत महसूल कर्मचारी आणि विभागीय अधिकारी' },
  officialEmailLabel: { en: 'Official Email / Username', hi: 'आधिकारिक ई-मेल / उपयोगकर्ता नाम', mr: 'अधिकृत ई-मेल / वापरकर्ता नाव' },
  passwordLabel: { en: 'Password', hi: 'पासवर्ड', mr: 'पासवर्ड' },
  rememberMe: { en: 'Remember Me', hi: 'मुझे याद रखें', mr: 'माझी माहिती लक्षात ठेवा' },
  forgotPassword: { en: 'Forgot Password?', hi: 'पासवर्ड भूल गए?', mr: 'पासवर्ड विसरलात?' },
  signInBtn: { en: 'Sign In to Portal', hi: 'पोर्टल में साइन इन करें', mr: 'पोर्टलमध्ये प्रवेश करा' },
  showPassword: { en: 'Show Password', hi: 'पासवर्ड दिखाएं', mr: 'पासवर्ड दाखवा' },
  hidePassword: { en: 'Hide Password', hi: 'पासवर्ड छिपाएं', mr: 'पासवर्ड लपवा' },
  developerDemoHeading: { en: 'Demo & Development Accounts (Non-Production)', hi: 'डेमो एवं विकास खाते (गैर-उत्पादन)', mr: 'डेमो व चाचणी खाती (चाचणीसाठी)' },
  operatorDesc: { en: 'Digitization & Verification', hi: 'डिजिटलीकरण एवं सत्यापन', mr: 'डिजिटलीकरण व पडताळणी' },
  officerDesc: { en: 'Review & Approval', hi: 'समीक्षा एवं अनुमोदन', mr: 'पुनरावलोकन व मंजुरी' },
  adminDesc: { en: 'Cadastre & Analytics', hi: 'भू-नक्शा एवं विश्लेषण', mr: 'भू-नकाशा व विश्लेषण' },
  loginFooterNote: { en: 'Digital Land Records Management & Verification System — All records processed under government data security guidelines.', hi: 'डिजिटल भू-अभिलेख प्रबंधन एवं सत्यापन प्रणाली — सभी अभिलेख सरकारी डेटा सुरक्षा दिशानिर्देशों के तहत प्रसंस्कृत।', mr: 'डिजिटल जमीन महसूल व्यवस्थापन आणि पडताळणी प्रणाली — सर्व अभिलेख शासकीय डेटा सुरक्षा नियमांनुसार प्रसंस्कृत.' },
  privacyPolicy: { en: 'Privacy Policy', hi: 'गोपनीयता नीति', mr: 'गोपनीयता धोरण' },
  termsOfUse: { en: 'Terms of Use', hi: 'उपयोग की शर्तें', mr: 'वापराच्या अटी' },
  accessibility: { en: 'Accessibility', hi: 'सुगमता', mr: 'सुलभता' },
  help: { en: 'Help & Support', hi: 'सहायता एवं संपर्क', mr: 'मदत व संपर्क' },

  // Operator Dashboard
  operatorSubtitle: { en: 'Upload land records, verify extracted attributes, and resolve flags before officer approval.', hi: 'भू-अभिलेख अपलोड करें, विवरण सत्यापित करें और अधिकारी अनुमोदन हेतु प्रस्तुत करें।', mr: 'जमीन महसूल अभिलेख अपलोड करा, तपशील तपासा आणि अधिकारी मंजुरीसाठी सादर करा.' },
  uploadNewBatch: { en: 'Upload New Records Batch', hi: 'नया अभिलेख बैच अपलोड करें', mr: 'नवीन अभिलेख बॅच अपलोड करा' },
  documentsProcessed: { en: 'Documents Processed', hi: 'प्रसंस्कृत दस्तावेज़', mr: 'प्रक्रिया केलेले दस्तऐवज' },
  originalScansPreserved: { en: '100% Original scans secured', hi: '100% मूल स्कैन सुरक्षित', mr: '१००% मूळ स्कॅन सुरक्षित' },
  needsReview: { en: 'Needs Review', hi: 'समीक्षा आवश्यक', mr: 'पडताळणी आवश्यक' },
  awaitingOperatorCheck: { en: 'Awaiting operator verification', hi: 'ऑपरेटर जांच हेतु प्रतीक्षारत', mr: 'कर्मचारी तपासणी प्रलंबित' },
  averageConfidence: { en: 'Average Accuracy', hi: 'औसत अचूकता', mr: 'सरासरी अचूकता' },
  weightedFormula: { en: 'Automated verification score', hi: 'स्वचालित सत्यापन स्कोर', mr: 'स्वयंचलित पडताळणी गुण' },
  approvedAndSynced: { en: 'Approved & Synced', hi: 'स्वीकृत एवं सिंक', mr: 'मंजूर व सिंक' },
  committedToLedger: { en: 'Committed to State LRMS', hi: 'राज्य LRMS में दर्ज', mr: 'राज्य LRMS मध्ये नोंदवले' },
  govPipelineTitle: { en: 'Digitization & Verification Workflow', hi: 'डिजिटलीकरण एवं सत्यापन कार्यप्रवाह', mr: 'डिजिटलीकरण आणि पडताळणी कार्यप्रवाह' },
  govPipelineSubtitle: { en: 'Automated Extraction & Revenue Officer Verification', hi: 'स्वचालित निष्कर्षण एवं राजस्व अधिकारी सत्यापन चरण', mr: 'स्वयंचलित निष्कर्षण आणि महसूल अधिकारी पडताळणी' },
  docsAwaitingReview: { en: 'Documents Queue', hi: 'दस्तावेज़ कतार', mr: 'दस्तऐवज रांग' },
  docsAwaitingDesc: { en: 'List of scanned records pending review and field verification.', hi: 'समीक्षा और फ़ील्ड सत्यापन हेतु प्रतीक्षारत स्कैन किए गए अभिलेखों की सूची।', mr: 'तपासणी व तपशील पडताळणीसाठी प्रलंबित असलेल्या स्कॅन केलेल्या अभिलेखांची यादी.' },
  activeBatches: { en: 'Active Batches', hi: 'सक्रिय बैच', mr: 'सक्रिय बॅच' },
  recordsCount: { en: 'Records', hi: 'अभिलेख', mr: 'अभिलेख' },
  avgConfShort: { en: 'Accuracy', hi: 'अचूकता', mr: 'अचूकता' },
  openWorkspace: { en: 'Review Record', hi: 'अभिलेख जांचें', mr: 'अभिलेख तपासा' },
  noDocsInQueue: { en: 'No documents currently in queue. Upload a batch to start processing.', hi: 'वर्तमान में कतार में कोई दस्तावेज़ नहीं है। नया बैच अपलोड करें।', mr: 'सध्या रांगेत कोणतेही दस्तऐवज नाहीत. नवीन बॅच अपलोड करा.' },

  // Table Columns
  colDocument: { en: 'Document', hi: 'दस्तावेज़', mr: 'दस्तऐवज' },
  colOwnerName: { en: 'Owner Name / Landholder', hi: 'भूस्वामी / खातेदार', mr: 'खातेदाराचे नाव' },
  colKhasraPlot: { en: 'Gat / Survey / Area', hi: 'गट / सर्वे / क्षेत्र', mr: 'गट / सर्व्हे क्र. व क्षेत्र' },
  colVillageDistrict: { en: 'Village & District', hi: 'ग्राम व ज़िला', mr: 'गाव व जिल्हा' },
  colLandType: { en: 'Land Type', hi: 'भूमि श्रेणी', mr: 'जमिनीचा प्रकार' },
  colConfidence: { en: 'Accuracy', hi: 'अचूकता', mr: 'अचूकता' },
  colStatus: { en: 'Workflow Status', hi: 'कार्यप्रवाह स्थिति', mr: 'कार्यप्रवाह स्थिती' },
  colAction: { en: 'Action', hi: 'कार्रवाई', mr: 'कृती' },
  colJurisdiction: { en: 'Jurisdiction', hi: 'अधिकार क्षेत्र', mr: 'अधिकार क्षेत्र' },
  colWorkflowStatus: { en: 'Workflow Status', hi: 'कार्यप्रवाह स्थिति', mr: 'कार्यप्रवाह स्थिती' },
  colOfficerAction: { en: 'Action', hi: 'कार्रवाई', mr: 'कृती' },

  // Status Labels
  status_pushed_to_lrms: { en: 'Synced', hi: 'सिंक', mr: 'सिंक' },
  status_approved: { en: 'Approved', hi: 'स्वीकृत', mr: 'मंजूर' },
  status_reviewed: { en: 'Pending Approval', hi: 'अनुमोदन प्रलंबित', mr: 'मंजुरी प्रलंबित' },
  status_needs_review: { en: 'Needs Review', hi: 'समीक्षा आवश्यक', mr: 'पडताळणी आवश्यक' },
  status_processing: { en: 'Processing', hi: 'प्रक्रिया जारी', mr: 'प्रक्रिया सुरू' },
  status_rejected: { en: 'Returned / Redo', hi: 'सुधार हेतु वापस', mr: 'पुनरावलोकनासाठी परत' },
  status_queued: { en: 'Queued', hi: 'कतार में', mr: 'रांगेत' },
  status_verified: { en: 'Verified', hi: 'सत्यापित', mr: 'पडताळलेले' },

  // Accuracy levels
  highConfidence: { en: 'High', hi: 'उच्च', mr: 'उच्च' },
  mediumConfidence: { en: 'Standard', hi: 'मानक', mr: 'मध्यम' },
  lowConfidence: { en: 'Low — Verify', hi: 'कम — जांचें', mr: 'कमी — तपासा' },

  // Officer Queue & Review
  officerQueueTitle: { en: 'Officer Approval Queue', hi: 'अधिकारी स्वीकृति कतार', mr: 'अधिकारी मंजुरी रांग' },
  officerRankBadge: { en: 'Approval Authority Level', hi: 'अनुमोदन प्राधिकारी स्तर', mr: 'मंजुरी प्राधिकारी स्तर' },
  officerQueueSubtitle: { en: 'Inspect digitized records, verify human corrections, and authorize synchronization with the State Land Records Registry.', hi: 'डिजिटलीकृत अभिलेखों की जांच करें, मानवीय सुधारों का सत्यापन करें और राज्य भू-अभिलेख में प्रविष्टि स्वीकृत करें।', mr: 'डिजिटलीकृत अभिलेख तपासा, कर्मचाऱ्यांनी केलेल्या दुरुस्त्यांची खात्री करा आणि राज्य महसूल लेजरमध्ये मंजुरी द्या.' },
  recordsPendingReview: { en: 'Pending Approval', hi: 'स्वीकृति हेतु लंबित', mr: 'मंजुरीसाठी प्रलंबित' },
  filters: { en: 'Filters', hi: 'फ़िल्टर', mr: 'फिल्टर' },
  filterDistrict: { en: 'Search District...', hi: 'ज़िला खोजें...', mr: 'जिल्हा शोधा...' },
  filterVillage: { en: 'Search Village...', hi: 'ग्राम खोजें...', mr: 'गाव शोधा...' },
  allStatuses: { en: 'All Statuses', hi: 'सभी स्थितियां', mr: 'सर्व स्थिती' },
  allLandTypes: { en: 'All Land Types', hi: 'सभी भूमि प्रकार', mr: 'सर्व जमिनीचे प्रकार' },
  allScans: { en: 'All Scans', hi: 'सभी स्कैन', mr: 'सर्व स्कॅन' },
  duplicateOnly: { en: 'Duplicate Records Only', hi: 'केवल डुप्लिकेट अभिलेख', mr: 'केवळ डुप्लिकेट अभिलेख' },
  reviewDiffBtn: { en: 'Review & Approve', hi: 'समीक्षा एवं स्वीकृति', mr: 'तपासा व मंजुरी द्या' },
  noRecordsFound: { en: 'No records found matching criteria.', hi: 'दिए गए मापदंडों के अनुसार कोई अभिलेख नहीं मिला।', mr: 'कोणतीही नोंद सापडली नाही.' },
  backToQueue: { en: 'Back to Queue', hi: 'कतार पर वापस जाएं', mr: 'रांगेवर परत जा' },
  officerDiffReviewTitle: { en: 'Officer Verification & Approval Workspace', hi: 'अधिकारी सत्यापन एवं अनुमोदन कार्यक्षेत्र', mr: 'अधिकारी पडताळणी व मंजुरी कार्यक्षेत्र' },
  diffBannerTitle: { en: 'Automated Extraction vs Operator Verification', hi: 'स्वचालित निष्कर्षण बनाम ऑपरेटर सत्यापन', mr: 'स्वयंचलित नोंद विरूद्ध ऑपरेटर पडताळणी' },
  diffBannerDesc: { en: 'Review operator modifications. Highlighting denotes fields where human review corrected automated extraction.', hi: 'ऑपरेटर संशोधनों का निरीक्षण करें। हाइलाइट उन फ़ील्ड को दर्शाता है जहां मानवीय सत्यापन द्वारा सुधार किया गया।', mr: 'ऑपरेटरने केलेले बदल तपासा. रंगीत भाग कर्मचाऱ्यांनी दुरुस्त केलेल्या नोंदी दर्शवतो.' },
  cadastralFieldCol: { en: 'Attribute / Field Name', hi: 'अभिलेख विवरण / फ़ील्ड नाम', mr: 'अभिलेख नोंद / नाव' },
  aiDraftCol: { en: 'Automated Extraction', hi: 'स्वचालित निष्कर्षण', mr: 'स्वयंचलित नोंद' },
  operatorVerifiedCol: { en: 'Verified Value', hi: 'सत्यापित मान', mr: 'सत्यापित मूल्य' },
  docAuditHistory: { en: 'Cryptographic Audit Trail (SHA-256)', hi: 'सुरक्षित ऑडिट लेजर (SHA-256)', mr: 'सुरक्षित ऑडिट नोंदी (SHA-256)' },
  eventsLogged: { en: 'events logged', hi: 'घटनाएं दर्ज', mr: 'नोंदी सुरक्षित' },
  addDifference: { en: 'Add Difference / Note', hi: 'अंतर / टिप्पणी दर्ज करें', mr: 'तफावत / नोंद जोडा' },
  approveAndSync: { en: 'Approve & Push to LRMS', hi: 'स्वीकृत करें एवं LRMS में सिंक करें', mr: 'मंजूर करा व LRMS सिंक करा' },
  rejectRecord: { en: 'Reject / Return for Redo', hi: 'अस्वीकार करें / सुधार हेतु लौटाएं', mr: 'अमान्य करा / दुरुस्तीसाठी पाठवा' },
  confirmApproveTitle: { en: 'Confirm Official Approval', hi: 'आधिकारिक स्वीकृति की पुष्टि करें', mr: 'शासकीय मंजुरीची खात्री करा' },
  confirmApproveDesc: { en: 'Are you sure you want to approve this land record and commit it to the State LRMS registry? This action will generate an immutable audit entry.', hi: 'क्या आप इस भू-अभिलेख को स्वीकृत करके राज्य LRMS में दर्ज करना चाहते हैं? यह क्रिया एक अपरिवर्तनीय ऑडिट प्रविष्टि उत्पन्न करेगी।', mr: 'आपण हा जमीन अभिलेख मंजूर करून राज्य LRMS मध्ये नोंदवू इच्छिता? या कृतीमुळे सुरक्षित ऑडिट नोंद तयार होईल.' },
  rejectionReasonPrompt: { en: 'Reason for Rejection / Return *', hi: 'अस्वीकृति / लौटाने का कारण *', mr: 'परत पाठवण्याचे कारण *' },
  rejectionPlaceholder: { en: 'Enter specific discrepancy (e.g., Survey number mismatch with cadastral boundary map)...', hi: 'विशिष्ट विसंगति दर्ज करें (उदा. भू-नक्शे के साथ सर्वे संख्या का बेमेल)...', mr: 'अचूक कारण नोंदवा (उदा. सर्व्हे क्रमांक भू-नकाशाशी जुळत नाही)...' },
  rejectionNotice: { en: 'Mandatory reason is recorded in audit history and notified to the operator.', hi: 'अनिवार्य कारण ऑडिट इतिहास में दर्ज होगा और ऑपरेटर को प्रेषित किया जाएगा।', mr: 'आवश्यक कारण ऑडिट नोंदीत नोंदवले जाईल आणि ऑपरेटरला सूचित केले जाईल.' },
  confirmRejection: { en: 'Confirm Rejection', hi: 'अस्वीकृति की पुष्टि करें', mr: 'अमान्य करण्याची पुष्टी करा' },
  cancel: { en: 'Cancel', hi: 'रद्द करें', mr: 'रद्द करा' },
  submitting: { en: 'Processing...', hi: 'प्रक्रिया जारी...', mr: 'प्रक्रिया सुरू...' },

  // Modals
  recordApprovedTitle: { en: 'Record Approved & Committed to LRMS', hi: 'अभिलेख स्वीकृत एवं लेजर में सुरक्षित', mr: 'अभिलेख मंजूर व लेजरमध्ये सुरक्षित' },
  recordApprovedDesc: { en: 'Land record has passed all validation rules and was synchronized with the State Land Records Gateway.', hi: 'भू-अभिलेख ने सभी सत्यापन नियमों को उत्तीर्ण कर लिया है एवं राज्य भू-अभिलेख गेटवे के साथ समन्वयित हो गया है।', mr: 'जमीन महसूल अभिलेख सर्व नियमांनुसार वैध ठरला असून राज्य भूलेख गेटवेसह समन्वयित झाला आहे.' },
  stateLrmsExternalId: { en: 'State LRMS Reference ID:', hi: 'राज्य LRMS संदर्भ संख्या:', mr: 'राज्य LRMS संदर्भ क्र.:' },
  cadastralRegistryCode: { en: 'Cadastral Registry Code:', hi: 'भू-राजस्व पंजी कोड:', mr: 'भू-नोंदणी सांकेतांक:' },
  auditEntryAppended: { en: 'Cryptographic Audit Log Entry Appended', hi: 'सुरक्षित ऑडिट प्रविष्टि दर्ज की गई', mr: 'सुरक्षित ऑडिट नोंद यशस्वीपणे जोडली' },
  viewAuditTrail: { en: 'View Audit Trail', hi: 'ऑडिट लेजर देखें', mr: 'ऑडिट लेजर पहा' },
  doneAndReturn: { en: 'Done & Return', hi: 'पूर्ण एवं वापस जाएं', mr: 'पूर्ण करून परत जा' },

  // Admin Dashboard
  executiveAnalyticsTitle: { en: 'Administrative Land Records Overview', hi: 'प्रशासनिक भू-अभिलेख समग्र अवलोकन', mr: 'प्रशासकीय जमीन महसूल समग्र आढावा' },
  realDbAggregations: { en: 'Live Database Telemetry', hi: 'प्रत्यक्ष डेटाबेस सांख्यिकी', mr: 'थेट डेटाबेस सांख्यिकी' },
  analyticsSubtitle: { en: 'Real-time telemetry across nationwide land records digitization, accuracy distributions, and cadastral coverage.', hi: 'भू-अभिलेख डिजिटलीकरण, अचूकता दर एवं राजस्व कवरेज का वास्तविक समय विश्लेषण।', mr: 'जमीन महसूल डिजिटलीकरण, अचूकता प्रमाण व कव्हरेजचे थेट विश्लेषण.' },
  totalRecords: { en: 'Total Records', hi: 'कुल अभिलेख', mr: 'एकूण अभिलेख' },
  pendingVerification: { en: 'Pending Verification', hi: 'सत्यापन हेतु लंबित', mr: 'पडताळणी प्रलंबित' },
  operatorQueue: { en: 'Operator Queue', hi: 'ऑपरेटर कतार', mr: 'ऑपरेटर रांग' },
  validationErrors: { en: 'Corrections Required', hi: 'सुधार आवश्यक', mr: 'दुरुस्ती आवश्यक' },
  ruleConsistency: { en: 'Rule Consistency', hi: 'नियम निरंतरता', mr: 'नियम सातत्य' },
  officerApproved: { en: 'Officer Approved', hi: 'अधिकारी स्वीकृत', mr: 'अधिकारी मंजूर' },
  verifiedRecords: { en: 'Verified Records', hi: 'सत्यापित अभिलेख', mr: 'पडताळलेले अभिलेख' },
  pushedToLrms: { en: 'LRMS Synced', hi: 'LRMS में दर्ज', mr: 'LRMS मध्ये नोंदवले' },
  stateCadastreSync: { en: 'State Registry Sync', hi: 'राज्य पंजी सिंक', mr: 'राज्य नोंदणी सिंक' },
  dualPassModel: { en: 'Multi-Engine Verification', hi: 'बहु-स्तरीय सत्यापन', mr: 'बहु-स्तरीय पडताळणी' },
  digitizationVelocity: { en: 'Digitization Velocity (Daily Throughput)', hi: 'डिजिटलीकरण गति (दैनिक उत्पादन)', mr: 'डिजिटलीकरण वेग (दैनिक क्षमता)' },
  workflowStatusBreakdown: { en: 'Workflow Status Breakdown', hi: 'कार्यप्रवाह स्थिति विवरण', mr: 'कार्यप्रवाह स्थिती तपशील' },
  aiConfidenceSpectrum: { en: 'Accuracy Distribution', hi: 'अचूकता दर वितरण', mr: 'अचूकता प्रमाण वितरण' },
  regionalProgressTitle: { en: 'District-wise Records & Coverage', hi: 'ज़िलेवार अभिलेख एवं कवरेज', mr: 'जिल्हानिहाय अभिलेख व कव्हरेज' },
  jurisdictionsTracked: { en: 'Jurisdictions Tracked', hi: 'ट्रैक किए गए क्षेत्र', mr: 'नोंदवलेली गावे' },
  colProcessedScans: { en: 'Processed Scans', hi: 'प्रसंस्कृत स्कैन', mr: 'प्रक्रिया केलेले स्कॅन' },
  colPending: { en: 'Pending', hi: 'लंबित', mr: 'प्रलंबित' },
  colPushedToLrms: { en: 'LRMS Synced', hi: 'LRMS सिंक', mr: 'LRMS नोंद' },
  colAvgConfidence: { en: 'Average Accuracy', hi: 'औसत अचूकता', mr: 'सरासरी अचूकता' },

  // GIS Map
  gisMapTitle: { en: 'Cadastral GIS Map & Coverage Heatmap', hi: 'जीआईएस भू-नक्शा एवं कवरेज हीटमॅप', mr: 'भू-नकाशा जीआयएस व कव्हरेज हीटमॅप' },
  gisMapSubtitle: { en: 'Spatial visualization of revenue villages with real-time digitized land record aggregations.', hi: 'वास्तविक समय में डिजिटलीकृत भू-अभिलेखों के साथ राजस्व गांवों का स्थानिक मानचित्रण।', mr: 'थेट डिजिटलीकृत जमीन अभिलेखांसह महसूल गावांचे नकाशावर दृश्यीकरण.' },
  gisDisclaimer: { en: 'Representative cadastral boundaries for demonstration and verification.', hi: 'प्रदर्शन एवं सत्यापन हेतु प्रतिनिधि भू-नक्शा सीमाएं।', mr: 'प्रदर्शन व पडताळणीसाठी प्रातिनिधिक भू-नकाशा सीमा.' },
  fullyDigitizedLegend: { en: 'Fully Digitized', hi: 'पूर्णतः डिजिटलीकृत', mr: 'पूर्ण डिजिटलीकृत' },
  needsReviewLegend: { en: 'Needs Review / Active', hi: 'समीक्षा आवश्यक / सक्रिय', mr: 'पडताळणी आवश्यक / सक्रिय' },
  partiallyDigitizedLegend: { en: 'Partially Digitized', hi: 'आंशिक डिजिटलीकृत', mr: 'अंशतः डिजिटलीकृत' },
  villageInspectionPanel: { en: 'Village Cadastral Inspection', hi: 'ग्राम भू-अभिलेख निरीक्षण', mr: 'गाव महसूल पाहणी' },
  liveDbMetrics: { en: 'Live Records Metrics', hi: 'लाइव अभिलेख मेट्रिक्स', mr: 'थेट अभिलेख सांख्यिकी' },
  digitizationStatus: { en: 'Digitization Status:', hi: 'डिजिटलीकरण स्थिति:', mr: 'डिजिटलीकरण स्थिती:' },
  scannedRecordsMetric: { en: 'Scanned Records', hi: 'स्कैन किए गए अभिलेख', mr: 'स्कॅन केलेले अभिलेख' },
  aiProcessedMetric: { en: 'Digitized & Verified', hi: 'डिजिटलीकृत एवं सत्यापित', mr: 'डिजिटलीकृत व पडताळलेले' },
  avgJurisdictionConf: { en: 'Average Jurisdiction Accuracy:', hi: 'औसत क्षेत्राधिकार अचूकता:', mr: 'सरासरी अचूकता:' },
  gisFootnote: { en: '* Integration adapters support standard GeoJSON / WFS layers from state GIS portals.', hi: '* राज्य जीआईएस पोर्टलों से मानक GeoJSON / WFS लेयर्स समर्थित हैं।', mr: '* राज्य जीआयएस पोर्टलमधून मानक GeoJSON / WFS लेयर्स समर्थित आहेत.' },
  clickVillagePrompt: { en: 'Click any village polygon on the map to inspect its digitization metrics.', hi: 'डिजिटलीकरण मेट्रिक्स देखने के लिए मानचित्र पर किसी भी ग्राम बहुभुज पर क्लिक करें।', mr: 'तपशील पाहण्यासाठी नकाशावरील गावावर क्लिक करा.' },

  // Audit Logs
  auditTrailTitle: { en: 'Immutable Cadastral Audit Trail', hi: 'अपरिवर्तनीय भू-राजस्व ऑडिट लेजर', mr: 'अपरिवर्तनीय महसूल ऑडिट लेजर' },
  appendOnlyLedger: { en: 'Append-Only Ledger', hi: 'केवल-जोड़ने योग्य लेजर', mr: 'सुरक्षित लेजर' },
  auditSubtitle: { en: 'Cryptographically recorded ledger of all human field corrections, officer decisions, and state LRMS commits.', hi: 'सभी मानवीय फ़ील्ड सुधारों, अधिकारी निर्णयों और राज्य LRMS प्रविष्टियों का सुरक्षित खाता।', mr: 'सर्व मानवीय दुरुस्त्या, अधिकारी निर्णय आणि LRMS नोंदींचा सुरक्षित हिशोब.' },
  nonRepudiationBadge: { en: 'Non-Repudiation Verified', hi: 'अस्वीकृति-रहित प्रमाणित', mr: 'कायदेशीर प्रमाणित' },
  filterDocIdPlaceholder: { en: 'Filter by Document ID...', hi: 'दस्तावेज़ आईडी द्वारा खोजें...', mr: 'दस्तऐवज आयडीने शोधा...' },
  displayingEntries: { en: 'Displaying', hi: 'प्रदर्शित', mr: 'दर्शवित आहे' },
  auditEntriesSuffix: { en: 'audit trail entries', hi: 'ऑडिट प्रविष्टियाँ', mr: 'ऑडिट नोंदी' },
  colTimestamp: { en: 'Timestamp (UTC)', hi: 'समय (UTC)', mr: 'वेळ (UTC)' },
  colUserRole: { en: 'User & Role', hi: 'उपयोगकर्ता व पद', mr: 'वापरकर्ता व पद' },
  colDocBatch: { en: 'Document / Batch', hi: 'दस्तावेज़ / बैच', mr: 'दस्तऐवज / बॅच' },
  colFieldName: { en: 'Field Name', hi: 'फ़ील्ड का नाम', mr: 'नोंदीचे नाव' },
  colChangeLog: { en: 'Change Log (Old → New)', hi: 'परिवर्तन लॉग (पूर्व → नया)', mr: 'बदल लॉग (जुने → नवीन)' },
  noAuditLogs: { en: 'No audit logs matching query criteria.', hi: 'खोज मापदंड से मेल खाते कोई ऑडिट लॉग नहीं मिले।', mr: 'कोणत्याही ऑडिट नोंदी सापडल्या नाहीत.' },

  // Batch Upload
  createBatchTitle: { en: 'Upload Scanned Land Records', hi: 'स्कैन किए गए भू-अभिलेख अपलोड करें', mr: 'स्कॅन केलेले जमीन अभिलेख अपलोड करा' },
  createBatchSubtitle: { en: 'Scanned records are encrypted at rest. Revenue jurisdiction is auto-extracted from document text.', hi: 'स्कैन प्रतियां सुरक्षित रूप से संग्रहीत होती हैं। क्षेत्राधिकार दस्तावेज़ से स्वतः निकाला जाता है।', mr: 'स्कॅन प्रती सुरक्षित एनक्रिप्टेड आहेत. गाव, तालुका व जिल्हा आपोआप ओळखले जातात.' },
  step1Metadata: { en: '1. Revenue Batch Details (Optional Auto-Detect)', hi: '1. राजस्व बैच विवरण (स्वचालित पहचान उपलब्ध)', mr: '१. महसूल बॅच तपशील (स्वयंचलित शोध)' },
  batchNameLabel: { en: 'Batch Name', hi: 'बैच का नाम', mr: 'बॅचचे नाव' },
  state: { en: 'State', hi: 'राज्य', mr: 'राज्य' },
  tehsilSubDivLabel: { en: 'Tehsil / Taluka (Auto-detected)', hi: 'तहसील / तालुका (स्वचालित)', mr: 'तालुका (स्वयंचलित)' },
  villageMauzaLabel: { en: 'Village / Mauza (Auto-detected)', hi: 'ग्राम / मौज़ा (स्वचालित)', mr: 'गाव / मौजे (स्वयंचलित)' },
  step2Scans: { en: '2. Scanned Land Records', hi: '2. स्कैन किए गए भू-अभिलेख', mr: '२. स्कॅन केलेले दस्तऐवज' },
  dragDropText: { en: 'Drag and drop PDF or image scans here, or', hi: 'यहाँ पीडीएफ या छवियां खींचें और छोड़ें, या', mr: 'येथे पीडीएफ किंवा फोटो टाका, किंवा' },
  browseFiles: { en: 'browse files', hi: 'फ़ाइलें चुनें', mr: 'फाईल निवडा' },
  supportedFormats: { en: 'Supports PDF, JPG, JPEG, PNG scanned documents', hi: 'PDF, JPG, JPEG, PNG समर्थित हैं', mr: 'PDF, JPG, JPEG, PNG समर्थित' },
  selectedFilesLabel: { en: 'Selected Files', hi: 'चयनित फ़ाइलें', mr: 'निवडलेल्या फाईली' },
  startExtractionBtn: { en: 'Upload & Process in Background', hi: 'अपलोड करें एवं प्रक्रिया शुरू करें', mr: 'अपलोड करा व प्रक्रिया सुरू करा' },

  // Document Review Workspace
  backToDashboard: { en: 'Back to Dashboard', hi: 'डैशबोर्ड पर वापस जाएं', mr: 'डॅशबोर्डवर परत जा' },
  overallConfidence: { en: 'Overall Accuracy Rating', hi: 'समग्र अचूकता दर', mr: 'एकूण अचूकता प्रमाण' },
  cannotSubmitWarning: { en: 'Attention required: Flagged fields must be verified before submitting.', hi: 'ध्यान दें: प्रस्तुत करने से पहले चिह्नित विवरणों का सत्यापन आवश्यक है।', mr: 'लक्ष द्या: सादर करण्यापूर्वी चिन्हांकित नोंदी तपासणे आवश्यक आहे.' },
  aiExtractedBannerTitle: { en: 'Extracted Land Record Attributes', hi: 'निकाला गया भू-अभिलेख डेटा', mr: 'काढलेला जमीन नोंदणी तपशील' },
  aiExtractedBannerDesc: { en: 'Verify extracted attributes against the authentic scanned document on the left. Changes are saved to the immutable audit trail.', hi: 'बाईं ओर मूल स्कैन प्रति के साथ विवरणों का मिलान करें। किए गए परिवर्तन ऑडिट लेजर में सुरक्षित रहेंगे।', mr: 'डाव्या बाजूला असलेल्या मूळ स्कॅन प्रतीसोबत नोंदी तपासा. केलेले बदल ऑडिट नोंदीत साठवले जातात.' },
  cadastralRulesTitle: { en: 'Administrative Validation Rules', hi: 'प्रशासनिक सत्यापन नियम', mr: 'शासकीय पडताळणी नियम' },
  passedCount: { en: 'Passed', hi: 'सफल', mr: 'यशस्वी' },
  warningsCount: { en: 'Warnings', hi: 'चेतावनियां', mr: 'सूचना' },
  blockingErrorsCount: { en: 'Action Required', hi: 'कार्रवाई आवश्यक', mr: 'कारवाई आवश्यक' },
  validationEngineInit: { en: 'Validation engine checking rules...', hi: 'सत्यापन इंजन नियमों की जांच कर रहा है...', mr: 'पडताळणी प्रणाली नियमांची तपासणी करत आहे...' },
  validationNotice: { en: 'Accuracy combines multi-engine OCR and cadastral revenue directory cross-checks.', hi: 'अचूकता दर बहु-इंजन OCR एवं राजस्व निर्देशिका मिलान पर आधारित है।', mr: 'अचूकता बहु-इंजिन OCR व महसूल निर्देशिकेवर आधारित आहे.' },
  submitForApproval: { en: 'Submit for Officer Approval', hi: 'अधिकारी अनुमोदन हेतु प्रस्तुत करें', mr: 'अधिकारी मंजुरीसाठी सादर करा' },
  loadingWorkspace: { en: 'Loading Document Workspace...', hi: 'दस्तावेज़ कार्यक्षेत्र लोड हो रहा है...', mr: 'दस्तऐवज कार्यक्षेत्र उघडत आहे...' },

  // Document Viewer
  immutableScanBadge: { en: 'SECURED ORIGINAL SCAN', hi: 'सुरक्षित मूल प्रति', mr: 'सुरक्षित मूळ प्रत' },
  zoomIn: { en: 'Zoom In', hi: 'बड़ा करें', mr: 'मोठे करा' },
  zoomOut: { en: 'Zoom Out', hi: 'छोटा करें', mr: 'लहान करा' },
  rotate: { en: 'Rotate 90°', hi: 'घुमाएं', mr: 'फिरवा ९०°' },
  fitToScreen: { en: 'Fit to Screen', hi: 'स्क्रीन के अनुसार', mr: 'स्क्रीननुसार' },
  viewerGuide: { en: 'Drag to pan • Scroll to zoom', hi: 'घुमाने के लिए खींचें • ज़ूम करने हेतु स्क्रॉल करें', mr: 'पॅन करण्यासाठी ड्रॅग करा • झूमसाठी स्क्रोल करा' },
  khasraBbox: { en: 'Highlighted Region', hi: 'चिह्नित क्षेत्र', mr: 'हायलाइट केलेला भाग' },

  // Field Names
  khasra_number: { en: 'Khasra / Gat Number', hi: 'खसरा / गट संख्या', mr: 'खसरा / गट क्रमांक' },
  owner_name: { en: 'Owner Name (Landholder)', hi: 'भूस्वामी / खातेदार का नाम', mr: 'खातेदाराचे नाव' },
  survey_number: { en: 'Survey Number', hi: 'सर्वे संख्या', mr: 'सर्व्हे क्रमांक' },
  khata_number: { en: 'Khata / Account Number', hi: 'खाता संख्या', mr: 'खाते क्रमांक' },
  plot_area: { en: 'Plot Area', hi: 'रकबा / क्षेत्रफल', mr: 'क्षेत्रफळ' },
  village: { en: 'Village', hi: 'ग्राम', mr: 'गाव' },
  tehsil: { en: 'Tehsil / Taluka', hi: 'तहसील / तालुका', mr: 'तालुका' },
  district: { en: 'District', hi: 'ज़िला', mr: 'जिल्हा' },
  land_classification: { en: 'Land Classification', hi: 'भूमि श्रेणी', mr: 'जमिनीचा प्रकार' },
  mutation_details: { en: 'Mutation Record / Endorsement', hi: 'दाखिल खारिज / फेरफार', mr: 'दाखल-खारिज / फेरफार' },
  registration_info: { en: 'Registration Info', hi: 'पंजीकरण विवरण', mr: 'नोंदणी तपशील' },

  // Field Edit Card
  edit: { en: 'Edit', hi: 'संशोधित करें', mr: 'दुरुस्त करा' },
  correctNow: { en: 'Correct Now', hi: 'अभी सुधारें', mr: 'आता दुरुस्त करा' },
  saveCorrection: { en: 'Save Correction', hi: 'सुधार सहेजें', mr: 'दुरुस्ती जतन करा' },
  verifiedAndCorrected: { en: 'Verified & Corrected', hi: 'सत्यापित एवं संशोधित', mr: 'पडताळणी व सुधारणा पूर्ण' },
  lowConfidenceVerify: { en: 'Low Accuracy — Compare with Scan', hi: 'कम अचूकता — स्कैन से मिलान करें', mr: 'कमी अचूकता — स्कॅन सोबत तपासा' },
  notExtracted: { en: 'Not extracted', hi: 'पहचाना नहीं गया', mr: 'नोंद सापडली नाही' },
  acceptedAi: { en: 'Verified', hi: 'सत्यापित', mr: 'प्रमाणित' },
  correctedTag: { en: 'Corrected', hi: 'संशोधित', mr: 'दुरुस्त' },

  // Quality Engine / Sidebar
  activeLearningLoop: { en: 'Continuous Quality Engine', hi: 'निरंतर गुणवत्ता प्रणाली', mr: 'गुणवत्ता नियंत्रण प्रणाली' },
  activeLearningDesc: { en: 'Officer verifications continuously calibrate recognition models and maintain ledger integrity.', hi: 'अधिकारी संशोधनों से मॉडल निरंतर सुधरता है एवं खाता सुरक्षित रहता है।', mr: 'अधिकाऱ्यांच्या सुधारणांमुळे प्रणालीची अचूकता सुधारते व लेजर सुरक्षित राहते.' },
  corrections: { en: 'Corrections', hi: 'संशोधन', mr: 'दुरुस्त्या' },
  samples: { en: 'Samples', hi: 'नमूने', mr: 'नमुने' }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  fontSize: 'sm' | 'base' | 'lg';
  setFontSize: (size: 'sm' | 'base' | 'lg') => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem('veribhoomi_lang') as Language) || 'en'
  );
  const [fontSize, setFontSizeState] = useState<'sm' | 'base' | 'lg'>(
    (localStorage.getItem('veribhoomi_font_size') as 'sm' | 'base' | 'lg') || 'base'
  );

  const applyFontSize = (size: 'sm' | 'base' | 'lg') => {
    if (size === 'sm') {
      document.documentElement.style.fontSize = '14px';
    } else if (size === 'lg') {
      document.documentElement.style.fontSize = '18px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
    document.documentElement.setAttribute('data-font-size', size);
  };

  const setLanguage = (lang: Language) => {
    localStorage.setItem('veribhoomi_lang', lang);
    setLanguageState(lang);
    document.documentElement.lang = lang;
  };

  const setFontSize = (size: 'sm' | 'base' | 'lg') => {
    localStorage.setItem('veribhoomi_font_size', size);
    setFontSizeState(size);
    applyFontSize(size);
  };

  useEffect(() => {
    document.documentElement.lang = language;
    applyFontSize(fontSize);
  }, [language, fontSize]);

  const t = (key: string): string => {
    const item = TRANSLATIONS[key];
    if (!item) return key;
    return item[language] || item['en'] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, fontSize, setFontSize, t }}>
      <div className="min-h-screen">
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};


