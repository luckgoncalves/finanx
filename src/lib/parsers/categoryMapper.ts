// Maps transaction descriptions to existing expense category IDs
export function suggestCategory(description: string): string {
  const d = description.toLowerCase();

  if (/netflix|spotify|prime video|disney\+|hbo|apple tv|youtube premium|deezer|globoplay|crunchyroll|paramount\+|telecine|mubi/i.test(d))
    return 'assinatura';

  if (/farmac|drogari|drogasil|raia|pague menos|unimed|hapvida|amil|bradesco sa[uú]de|hospital|cl[ií]nica|m[eé]dic|laborat|exame|odonto|saude|s[aá]ude/i.test(d))
    return 'saude';

  if (/vivo|claro|tim |oi |net |gvt|sky |nextel|algar|copel telecom|internet|telefon|telecom/i.test(d))
    return 'telefone';

  if (/energisa|cemig|enel|light |cpfl|coelba|coelce|copel|eletropau|celpe|eletrobras|conta de luz|energia el[eé]trica|celg/i.test(d))
    return 'luz';

  if (/condomin/i.test(d)) return 'condominio';

  if (/iptu/i.test(d)) return 'iptu';

  if (/ipva|dpvat|licenciamento|denatran|detran/i.test(d)) return 'ipva';

  if (/seguro|porto seguro|liberty|tokio marine|allianz|suhai|hdl segur/i.test(d))
    return 'seguro';

  if (/escola|faculdade|universidade|curso|udemy|coursera|duolingo|mensalidade escolar|educa[çc][aã]o/i.test(d))
    return 'educacao';

  return 'outros';
}
