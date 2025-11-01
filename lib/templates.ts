export type ConsentTemplate = 'sex-nda' | 'nda' | 'creative' | 'collab' | 'conversation';

export interface TemplateContent {
  title: string;
  text: string;
  feeDisclosure: string;
  requiredPhrase: string; // The phrase user must say during voice recording
}

const SEX_NDA_TEXT = `SEXUAL ACTIVITY NON-DISCLOSURE AGREEMENT

This agreement is entered into voluntarily by both parties for the purpose of establishing confidentiality regarding sexual activities.

1. CONFIDENTIALITY: Both parties agree to maintain complete confidentiality regarding all sexual activities, communications, and interactions that occur between them.

2. PROHIBITED DISCLOSURE: Neither party shall disclose, describe, or discuss the sexual activities or any related information to any third party, including but not limited to friends, family, social media, or any other public or private forum.

3. CONSENT VERIFICATION: This agreement is recorded on-chain via cryptographic verification including voice, biometric, and geolocation hashes to ensure authenticity and prevent coercion.

4. DURATION: This agreement remains in effect indefinitely unless both parties mutually consent to unlock the verification data through the EchoID protocol.

5. LEGAL BINDING: This agreement is legally binding and enforceable. Violation may result in legal consequences.`;

const NDA_TEXT = `STANDARD NON-DISCLOSURE AGREEMENT

This agreement establishes confidentiality between parties regarding shared information, communications, and interactions.

1. CONFIDENTIAL INFORMATION: All communications, documents, and shared information are considered confidential.

2. NON-DISCLOSURE: Parties agree not to disclose confidential information to third parties without mutual consent.

3. VERIFICATION: This agreement is cryptographically verified on-chain to ensure authenticity.

4. TERM: This agreement remains in effect until both parties agree to modify or terminate through the EchoID protocol.`;

const CREATIVE_TEXT = `CREATIVE COLLABORATION AGREEMENT

This agreement governs the collaborative creation of creative works and establishes ownership and confidentiality terms.

1. COLLABORATIVE WORK: Parties agree to collaborate on creative projects as specified.

2. OWNERSHIP: Ownership and rights to collaborative works shall be determined by mutual agreement.

3. CONFIDENTIALITY: All shared creative materials and discussions remain confidential unless otherwise agreed.

4. VERIFICATION: This agreement is cryptographically verified on-chain.`;

const COLLAB_TEXT = `BUSINESS COLLABORATION AGREEMENT

This agreement establishes terms for business collaboration and partnership.

1. SCOPE: Parties agree to collaborate on specified business activities.

2. CONFIDENTIALITY: All business discussions and materials remain confidential.

3. TERMS: Specific collaboration terms shall be agreed upon separately.

4. VERIFICATION: This agreement is cryptographically verified on-chain.`;

const CONVERSATION_TEXT = `CONVERSATION CONFIDENTIALITY AGREEMENT

This agreement establishes confidentiality for private conversations and communications.

1. PRIVATE CONVERSATIONS: All conversations and communications are considered private and confidential.

2. NON-DISCLOSURE: Parties agree not to disclose conversation content to third parties.

3. VERIFICATION: This agreement is cryptographically verified on-chain to ensure authenticity.

4. TERM: Confidentiality remains in effect until both parties agree to modify through the EchoID protocol.`;

const FEE_DISCLOSURE = `PROTOCOL FEE: By proceeding, you agree to pay a protocol fee to the EchoID treasury. This fee covers on-chain transaction costs and protocol maintenance. The fee amount will be displayed before final confirmation.`;

export const templates: Record<ConsentTemplate, TemplateContent> = {
  'sex-nda': {
    title: 'Sex NDA',
    text: SEX_NDA_TEXT,
    feeDisclosure: FEE_DISCLOSURE,
    requiredPhrase: 'I consent willingly and voluntarily to this agreement without coercion or pressure',
  },
  nda: {
    title: 'Standard NDA',
    text: NDA_TEXT,
    feeDisclosure: FEE_DISCLOSURE,
    requiredPhrase: 'I agree to this non-disclosure agreement willingly and without coercion',
  },
  creative: {
    title: 'Creative Collaboration',
    text: CREATIVE_TEXT,
    feeDisclosure: FEE_DISCLOSURE,
    requiredPhrase: 'I agree to this creative collaboration agreement voluntarily and freely',
  },
  collab: {
    title: 'Business Collaboration',
    text: COLLAB_TEXT,
    feeDisclosure: FEE_DISCLOSURE,
    requiredPhrase: 'I consent to this business collaboration agreement of my own free will',
  },
  conversation: {
    title: 'Conversation Confidentiality',
    text: CONVERSATION_TEXT,
    feeDisclosure: FEE_DISCLOSURE,
    requiredPhrase: 'I agree to maintain confidentiality of our conversations willingly and without pressure',
  },
};

export function getTemplate(template: ConsentTemplate): TemplateContent {
  return templates[template];
}

export function getAllTemplates(): Array<{ id: ConsentTemplate; content: TemplateContent }> {
  return Object.entries(templates).map(([id, content]) => ({
    id: id as ConsentTemplate,
    content,
  }));
}

