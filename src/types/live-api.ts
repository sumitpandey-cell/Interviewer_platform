export type LiveConfig = {
  model: string;
  generationConfig?: {
    responseModalities?: string | string[];
    speechConfig?: {
      voiceConfig?: {
        prebuiltVoiceConfig?: {
          voiceName: "Puck" | "Charon" | "Kore" | "Fenrir" | "Aoede";
        };
      };
    };
  };
  systemInstruction?: {
    parts: {
      text: string;
    }[];
  };
  tools?: Array<{ googleSearch: {} } | { codeExecution: {} }>;
  // Add transcription support with explicit language configuration
  inputAudioTranscription?: {
    language?: string;
    languageCode?: string;
  };
  outputAudioTranscription?: {
    language?: string;
    languageCode?: string;
  };
};

export type LiveIncomingMessage =
  | {
    serverContent: {
      modelTurn?: {
        parts: {
          text?: string;
          inlineData?: {
            mimeType: string;
            data: string;
          };
        }[];
      };
      inputTranscription?: {
        text: string;
      };
      outputTranscription?: {
        text: string;
      };
      turnComplete?: boolean;
      interrupted?: boolean;
    };
  }
  | {
    setupComplete: {};
  }
  | {
    toolCall: {
      functionCalls: {
        name: string;
        args: any;
        id: string;
      }[];
    };
  }
  | {
    toolCallCancellation: {
      ids: string[];
    };
  };

export type LiveOutgoingMessage =
  | {
    setup: LiveConfig;
  }
  | {
    clientContent: {
      turns: {
        role: "user";
        parts: {
          text?: string;
          inlineData?: {
            mimeType: string;
            data: string;
          };
        }[];
      }[];
      turnComplete?: boolean;
    };
  }
  | {
    realtimeInput: {
      mediaChunks: {
        mimeType: string;
        data: string;
      }[];
    };
  }
  | {
    toolResponse: {
      functionResponses: {
        response: any;
        id: string;
      }[];
    };
  };
