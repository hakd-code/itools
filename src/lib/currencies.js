// 币种表：13 种，两个下拉框同源。rate 存的是"1 USD = ? 该币"
export const CURRENCIES = [
  { code: 'USD', name: '美元' },
  { code: 'CNY', name: '人民币' },
  { code: 'EUR', name: '欧元' },
  { code: 'GBP', name: '英镑' },
  { code: 'HKD', name: '港元' },
  { code: 'JPY', name: '日元' },
  { code: 'KRW', name: '韩元' },
  { code: 'AUD', name: '澳大利亚元' },
  { code: 'CAD', name: '加拿大元' },
  { code: 'MOP', name: '澳门元' },
  { code: 'THB', name: '泰铢' },
  { code: 'TWD', name: '新台币' },
  { code: 'SGD', name: '新加坡元' },
];

export const CURRENCY_MAP = new Map(CURRENCIES.map((c) => [c.code, c]));
