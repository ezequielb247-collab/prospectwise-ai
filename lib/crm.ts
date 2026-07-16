export const CRM_STAGES=["Novo","Mensagem preparada","Contatado","Respondeu","Interessado","Reunião","Proposta","Negociação","Cliente","Sem interesse","Opt-out"] as const;
export type CrmStage=(typeof CRM_STAGES)[number];
