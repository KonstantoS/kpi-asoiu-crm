 WITH RECURSIVE child_nodes AS (
     SELECT documents.*, CAST ('/' || documents.original_name AS VARCHAR (100)) as path
     FROM documents WHERE documents.parent_id = 0
     UNION
     SELECT documents.*, CAST ( child_nodes.path ||'/'|| documents.original_name AS VARCHAR(100))
     FROM documents INNER JOIN child_nodes ON( child_nodes.id = documents.parent_id))
     SELECT * FROM child_nodes;

---
---
---
---

     WITH RECURSIVE child_nodes AS (
     SELECT documents.*, CAST ('/' || documents.original_name AS VARCHAR (100)) as path
     FROM documents WHERE documents.parent_id = 5
     UNION
     SELECT documents.*, CAST ( child_nodes.path ||'/'|| documents.original_name AS VARCHAR(100))
     FROM documents INNER JOIN child_nodes ON( child_nodes.id = documents.parent_id))

     SELECT * FROM child_nodes
      UNION
     SELECT documents.*, CAST ('./' AS VARCHAR (100)) as path FROM documents WHERE id = 5 ORDER BY path;



----
----
----
----




WITH RECURSIVE child_nodes AS (
     SELECT documents.*, CAST ('/' || documents.original_name AS VARCHAR (100)) as path
     FROM documents WHERE documents.parent_id = 5
     UNION
     SELECT documents.*, CAST ( child_nodes.path ||'/'|| documents.original_name AS VARCHAR(100))
     FROM documents INNER JOIN child_nodes ON( child_nodes.id = documents.parent_id)
     )
     INSERT INTO document_users
     SELECT id AS doc_id, 1 AS user_id, 1 AS access, false AS root_share FROM child_nodes
     UNION
     SELECT id AS doc_id, 4 AS user_id, 1 AS access, false AS root_share FROM child_nodes;

----
----
----
----
----
----
----
---- Content sharing in directory
---- 1. user share
---- 2. group share
---- 3. global share

     WITH
        RECURSIVE child_nodes AS (
            SELECT documents.id
            FROM documents WHERE documents.parent_id = 5
        UNION
            SELECT documents.id FROM documents
            INNER JOIN child_nodes ON (child_nodes.id = documents.parent_id)
        ), dusers AS (
        INSERT INTO document_users
            SELECT id AS doc_id, 1 AS user_id, 1 AS access, false AS root_share FROM child_nodes
        UNION
            SELECT id AS doc_id, 4 AS user_id, 1 AS access, false AS root_share FROM child_nodes
        RETURNING *
        ), dgroups AS (
            INSERT INTO document_groups
            SELECT DISTINCT doc_id, 1 AS group_id, 1 AS access, false AS root_share FROM dusers
            RETURNING *
        )
        UPDATE documents SET access = 1 WHERE id IN (SELECT doc_id FROM dgroups);


     SELECT FROM (INSERT INTO document_users VALUES (5, 1, 3, true) RETURNING doc_id) AS doc_id, (INSERT INTO document_groups VALUES (5,1,3,true) RETURNING doc_id)
