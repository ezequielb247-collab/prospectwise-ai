export const CSV_FIELDS=["name","phone","website","address","city","state","category","rating","reviews","mapsUrl","instagram","facebook"] as const;
export type CsvField=(typeof CSV_FIELDS)[number];
export type CsvColumnMapping=Record<string,CsvField|"ignore">;
export type NormalizedCsvLead={name:string;phone:string|null;website:string|null;address:string|null;city:string|null;state:string|null;category:string|null;rating:number|null;reviews:number|null;mapsUrl:string|null;instagram:string|null;facebook:string|null;provider:"csv_import"};
export type CsvPreviewRow={line:number;valid:boolean;duplicate:boolean;missingFields:CsvField[];errors:string[];lead:NormalizedCsvLead};
export type CsvPreview={headers:Array<{source:string;suggested:CsvField|"ignore";recognized:boolean}>;rows:CsvPreviewRow[];examples:CsvPreviewRow[];stats:{total:number;valid:number;invalid:number;duplicates:number};missingFields:Partial<Record<CsvField,number>>;delimiter:string};
export type CsvImportResult={imported:number;duplicates:number;invalid:number;leadIds:string[]};
