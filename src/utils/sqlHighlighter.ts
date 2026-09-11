// High-performance, tailored T-SQL Syntax Tokenizer & Highlighter

export interface Token {
  type: 'keyword' | 'function' | 'dmv' | 'type' | 'string' | 'number' | 'comment' | 'variable' | 'bracket' | 'operator' | 'punctuation' | 'text';
  value: string;
}

const KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER', 'CROSS', 'APPLY',
  'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 'EXISTS', 'LIKE', 'BETWEEN', 'IS', 'NULL', 'TOP', 'DISTINCT',
  'GROUP', 'BY', 'ORDER', 'HAVING', 'ASC', 'DESC', 'OVER', 'PARTITION', 'UNION', 'ALL', 'EXCEPT', 'INTERSECT',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'MERGE', 'MATCHED', 'OUTPUT', '$ACTION',
  'CREATE', 'ALTER', 'DROP', 'TRUNCATE', 'TABLE', 'VIEW', 'PROCEDURE', 'PROC', 'FUNCTION', 'TRIGGER', 'INDEX',
  'SCHEMA', 'DATABASE', 'TYPE', 'SEQUENCE', 'SYNONYM', 'CONSTRAINT', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES',
  'UNIQUE', 'CHECK', 'DEFAULT', 'CLUSTERED', 'NONCLUSTERED', 'COLUMNSTORE', 'REBUILD', 'REORGANIZE',
  'BEGIN', 'END', 'TRANSACTION', 'TRAN', 'COMMIT', 'ROLLBACK', 'SAVE',
  'TRY', 'CATCH', 'THROW', 'RAISERROR', 'PRINT', 'RETURN', 'RETURNS',
  'IF', 'ELSE', 'WHILE', 'BREAK', 'CONTINUE', 'WAITFOR', 'DELAY',
  'CASE', 'WHEN', 'THEN', 'ELSE',
  'DECLARE', 'EXEC', 'EXECUTE', 'WITH', 'CTE', 'RECURSIVE', 'OPTION', 'RECOMPILE', 'MAXDOP', 'OPTIMIZE',
  'FOR', 'SCHEME', 'FILEGROUP', 'IDENTITY', 'GO', 'USE', 'COLLATE', 'NOLOCK', 'READPAST', 'UPDLOCK', 'HOLDLOCK',
  'ROWLOCK', 'PAGLOCK', 'TABLOCK', 'TABLOCKX', 'XLOCK'
]);

const DATA_TYPES = new Set([
  'BIGINT', 'INT', 'INTEGER', 'SMALLINT', 'TINYINT', 'BIT', 'DECIMAL', 'NUMERIC', 'MONEY', 'SMALLMONEY',
  'FLOAT', 'REAL', 'DATE', 'DATETIME', 'DATETIME2', 'DATETIMEOFFSET', 'TIME', 'CHAR', 'VARCHAR',
  'NCHAR', 'NVARCHAR', 'TEXT', 'NTEXT', 'BINARY', 'VARBINARY', 'IMAGE', 'UNIQUEIDENTIFIER', 'XML', 'SQL_VARIANT',
  'SYSNAME', 'GEOGRAPHY', 'GEOMETRY', 'HIERARCHYID'
]);

const BUILTIN_FUNCTIONS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COUNT_BIG',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE',
  'COALESCE', 'ISNULL', 'NULLIF', 'IIF', 'CHOOSE',
  'GETDATE', 'GETUTCDATE', 'SYSDATETIME', 'SYSUTCDATETIME', 'SYSDATETIMEOFFSET',
  'DATEADD', 'DATEDIFF', 'DATEPART', 'DATENAME', 'YEAR', 'MONTH', 'DAY', 'EOMONTH',
  'CONVERT', 'CAST', 'TRY_CONVERT', 'TRY_CAST', 'PARSE', 'TRY_PARSE',
  'LEN', 'DATALENGTH', 'CHARINDEX', 'PATINDEX', 'SUBSTRING', 'LEFT', 'RIGHT', 'LTRIM', 'RTRIM', 'TRIM',
  'UPPER', 'LOWER', 'REPLACE', 'REVERSE', 'STUFF', 'FORMAT', 'CONCAT', 'CONCAT_WS', 'STRING_SPLIT', 'STRING_AGG',
  'QUOTENAME', 'OBJECT_NAME', 'OBJECT_ID', 'DB_NAME', 'DB_ID', 'SCHEMA_NAME', 'SCHEMA_ID', 'OBJECT_SCHEMA_NAME',
  'OBJECT_DEFINITION', 'COL_NAME', 'INDEX_COL', 'INDEXKEY_PROPERTY', 'COLUMNPROPERTY', 'DATABASEPROPERTYEX',
  'ERROR_NUMBER', 'ERROR_MESSAGE', 'ERROR_LINE', 'ERROR_PROCEDURE', 'ERROR_SEVERITY', 'ERROR_STATE',
  'XACT_STATE', 'JSON_VALUE', 'JSON_QUERY', 'OPENJSON', 'ISJSON', 'JSON_MODIFY'
]);

export function tokenizeSql(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const len = sql.length;

  while (i < len) {
    const char = sql[i];

    // 1. Whitespace
    if (/\s/.test(char)) {
      let ws = '';
      while (i < len && /\s/.test(sql[i])) {
        ws += sql[i++];
      }
      tokens.push({ type: 'text', value: ws });
      continue;
    }

    // 2. Single-line comment: -- ...
    if (char === '-' && sql[i + 1] === '-') {
      let comment = '';
      while (i < len && sql[i] !== '\n') {
        comment += sql[i++];
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    // 3. Multi-line comment: /* ... */
    if (char === '/' && sql[i + 1] === '*') {
      let comment = '/*';
      i += 2;
      while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) {
        comment += sql[i++];
      }
      if (i < len) {
        comment += '*/';
        i += 2;
      }
      tokens.push({ type: 'comment', value: comment });
      continue;
    }

    // 4. Bracketed identifier: [dbo].[Table]
    if (char === '[') {
      let bracket = '[';
      i++;
      while (i < len && sql[i] !== ']') {
        bracket += sql[i++];
      }
      if (i < len) {
        bracket += ']';
        i++;
      }
      tokens.push({ type: 'bracket', value: bracket });
      continue;
    }

    // 5. String literal: '...' (with '' escape)
    if (char === "'") {
      let str = "'";
      i++;
      while (i < len) {
        if (sql[i] === "'") {
          str += "'";
          i++;
          if (sql[i] === "'") {
            str += "'";
            i++;
          } else {
            break;
          }
        } else {
          str += sql[i++];
        }
      }
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // 6. Global or local Variables & Temp tables: @var, @@SPID, #temp, ##global
    if (char === '@' || char === '#') {
      let varName = char;
      i++;
      if (i < len && (sql[i] === '@' || sql[i] === '#')) {
        varName += sql[i++];
      }
      while (i < len && /[a-zA-Z0-9_]/.test(sql[i])) {
        varName += sql[i++];
      }
      tokens.push({ type: 'variable', value: varName });
      continue;
    }

    // 7. Numbers (including decimal)
    if (/[0-9]/.test(char)) {
      let num = '';
      while (i < len && /[0-9.]/.test(sql[i])) {
        num += sql[i++];
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // 8. Word tokens (DMVs like sys.dm_..., functions, keywords, types, or identifiers)
    if (/[a-zA-Z_]/.test(char)) {
      let word = '';
      while (i < len && /[a-zA-Z0-9_.]/.test(sql[i])) {
        word += sql[i++];
      }

      const upper = word.toUpperCase();

      // Check if it's a DMV or system catalog
      if (word.startsWith('sys.') || word.startsWith('msdb.') || word.startsWith('INFORMATION_SCHEMA.')) {
        tokens.push({ type: 'dmv', value: word });
      } else if (KEYWORDS.has(upper)) {
        tokens.push({ type: 'keyword', value: word });
      } else if (DATA_TYPES.has(upper)) {
        tokens.push({ type: 'type', value: word });
      } else if (BUILTIN_FUNCTIONS.has(upper)) {
        tokens.push({ type: 'function', value: word });
      } else {
        tokens.push({ type: 'text', value: word });
      }
      continue;
    }

    // 9. Operators and punctuation
    if (/[=<>!+*/%&|^~]/.test(char)) {
      let op = char;
      i++;
      if (i < len && /[=<>!]/.test(sql[i])) {
        op += sql[i++];
      }
      tokens.push({ type: 'operator', value: op });
      continue;
    }

    if (/[,;().]/.test(char)) {
      tokens.push({ type: 'punctuation', value: char });
      i++;
      continue;
    }

    // Fallback
    tokens.push({ type: 'text', value: char });
    i++;
  }

  return tokens;
}

export function getTokenClass(type: Token['type']): string {
  switch (type) {
    case 'keyword':
      return 'text-sky-400 font-semibold';
    case 'function':
      return 'text-purple-400 font-medium';
    case 'dmv':
      return 'text-emerald-400 font-mono';
    case 'type':
      return 'text-indigo-400';
    case 'string':
      return 'text-amber-300';
    case 'number':
      return 'text-orange-400';
    case 'comment':
      return 'text-slate-500 italic';
    case 'variable':
      return 'text-pink-400 font-medium';
    case 'bracket':
      return 'text-teal-300';
    case 'operator':
      return 'text-cyan-300';
    case 'punctuation':
      return 'text-slate-400';
    default:
      return 'text-slate-200';
  }
}
