// Client-side SQL Formatter for T-SQL

const MAJOR_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY',
  'INSERT INTO', 'INSERT', 'UPDATE', 'DELETE FROM', 'DELETE',
  'MERGE INTO', 'MERGE', 'VALUES', 'SET',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
  'CREATE PROCEDURE', 'ALTER PROCEDURE', 'CREATE FUNCTION', 'ALTER FUNCTION',
  'CREATE VIEW', 'ALTER VIEW', 'CREATE INDEX', 'ALTER INDEX',
  'BEGIN TRY', 'END TRY', 'BEGIN CATCH', 'END CATCH',
  'BEGIN TRANSACTION', 'BEGIN TRAN', 'COMMIT TRANSACTION', 'COMMIT TRAN', 'ROLLBACK TRANSACTION', 'ROLLBACK TRAN',
  'INNER JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN',
  'FULL JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'CROSS APPLY', 'OUTER APPLY',
  'UNION ALL', 'UNION', 'EXCEPT', 'INTERSECT',
  'WITH', 'GO'
];

export function formatSql(rawSql: string): string {
  if (!rawSql || !rawSql.trim()) return '';

  let sql = rawSql.trim();

  // Protect string literals and comments during uppercase substitution
  const strings: string[] = [];
  const comments: string[] = [];

  // 1. Replace multi-line comments
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    comments.push(match);
    return `___COMMENT_${comments.length - 1}___`;
  });

  // 2. Replace single-line comments
  sql = sql.replace(/--.*$/gm, (match) => {
    comments.push(match);
    return `___COMMENT_${comments.length - 1}___`;
  });

  // 3. Replace single-quoted strings
  sql = sql.replace(/'(?:''|[^'])*'/g, (match) => {
    strings.push(match);
    return `___STRING_${strings.length - 1}___`;
  });

  // 4. Uppercase standard keywords
  const keywordsToUppercase = [
    'select', 'from', 'where', 'join', 'inner', 'left', 'right', 'outer', 'cross', 'apply',
    'on', 'as', 'and', 'or', 'not', 'in', 'exists', 'like', 'between', 'is', 'null', 'top', 'distinct',
    'group', 'by', 'order', 'having', 'asc', 'desc', 'over', 'partition', 'union', 'all',
    'insert', 'into', 'values', 'update', 'set', 'delete', 'merge', 'matched',
    'create', 'alter', 'drop', 'truncate', 'table', 'view', 'procedure', 'proc', 'function',
    'index', 'constraint', 'primary', 'key', 'foreign', 'references', 'unique', 'check', 'default',
    'begin', 'end', 'try', 'catch', 'throw', 'raiserror', 'print', 'return',
    'transaction', 'tran', 'commit', 'rollback', 'if', 'else', 'case', 'when', 'then',
    'declare', 'exec', 'execute', 'with', 'rebuild', 'reorganize'
  ];

  for (const kw of keywordsToUppercase) {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    sql = sql.replace(regex, kw.toUpperCase());
  }

  // 5. Structure major clause breaks
  const lineBreakClauses = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY',
    'INNER JOIN', 'LEFT JOIN', 'LEFT OUTER JOIN', 'RIGHT JOIN', 'RIGHT OUTER JOIN',
    'FULL JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'CROSS APPLY', 'OUTER APPLY',
    'UNION ALL', 'UNION', 'EXCEPT', 'INTERSECT',
    'INSERT INTO', 'VALUES', 'SET',
    'BEGIN TRY', 'END TRY', 'BEGIN CATCH', 'END CATCH',
    'BEGIN TRAN', 'COMMIT TRAN', 'ROLLBACK TRAN'
  ];

  for (const clause of lineBreakClauses) {
    const regex = new RegExp(`\\s+(${clause})\\b`, 'g');
    sql = sql.replace(regex, `\n$1`);
  }

  // 6. Split SELECT columns if on single line with commas
  // Format line indentation based on clauses
  const lines = sql.split('\n');
  const formattedLines: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    const upper = line.toUpperCase();

    // Indent sub-clauses or condition lines
    if (
      upper.startsWith('INNER JOIN') ||
      upper.startsWith('LEFT JOIN') ||
      upper.startsWith('LEFT OUTER JOIN') ||
      upper.startsWith('RIGHT JOIN') ||
      upper.startsWith('CROSS APPLY') ||
      upper.startsWith('OUTER APPLY') ||
      upper.startsWith('ON ') ||
      upper.startsWith('AND ') ||
      upper.startsWith('OR ')
    ) {
      formattedLines.push(`    ${line}`);
    } else if (
      upper.startsWith('SELECT') ||
      upper.startsWith('FROM') ||
      upper.startsWith('WHERE') ||
      upper.startsWith('GROUP BY') ||
      upper.startsWith('ORDER BY') ||
      upper.startsWith('HAVING') ||
      upper.startsWith('INSERT') ||
      upper.startsWith('UPDATE') ||
      upper.startsWith('DELETE') ||
      upper.startsWith('CREATE') ||
      upper.startsWith('ALTER') ||
      upper.startsWith('DROP') ||
      upper.startsWith('BEGIN') ||
      upper.startsWith('END') ||
      upper.startsWith('WITH')
    ) {
      formattedLines.push(line);
    } else {
      // Default indentation for columns or inner statements
      formattedLines.push(`    ${line}`);
    }
  }

  let result = formattedLines.join('\n');

  // Restore string literals
  result = result.replace(/___STRING_(\d+)___/g, (_, idx) => strings[parseInt(idx, 10)]);

  // Restore comments
  result = result.replace(/___COMMENT_(\d+)___/g, (_, idx) => comments[parseInt(idx, 10)]);

  return result;
}
