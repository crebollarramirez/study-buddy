declare module "pg" {
  export interface QueryResult<R = any> {
    rows: R[];
    rowCount: number;
  }

  export class Pool {
    constructor(config: { connectionString?: string });
    query<R = any>(text: string, params?: any[]): Promise<QueryResult<R>>;
    end(): Promise<void>;
  }
}
