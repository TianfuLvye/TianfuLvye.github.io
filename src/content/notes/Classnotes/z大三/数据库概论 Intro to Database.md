---
tags:
  - 专业课
banner: 9ba110493be47633eb4b60640301e7cd.jpg
theme:
---
 


# Chapter 2: E/R 模型
E/R model is the abbreviation of Entity/Relation model.

![[../../attachments/chap02 ER模型(1) (1).pdf#height=100]]

### The 「Appearance」of E/R model
As the figure below.
![[../../attachments/Pasted image 20260325201541.png|443]]

- rectangle: entity
- diamond: relation
- oval: attribute

Arrows:
![[../../attachments/Pasted image 20260325201825.png|346]]
for example: A is student and B is head teacher（班主任）. Each student only has one head teacher.

The arrow could also be pointed onto R. What's more, it can also be presented in this form:
![[../../attachments/Pasted image 20260325202053.png|327]]
If A and B are identical in entity level, it can also be transformed into this form:
![[../../attachments/Pasted image 20260325202233.png|168]]
In this figure, one employee(A) can 「lead」another employee(B). However, both of them are employees.

### Some Extend Features about E/R model
#### Weak Entity
If an entity's every attribute can't form a primary key, then that entity is a **weak entity**. Use a rectangle with outline to describe it. 
![[../../attachments/Pasted image 20260325202750.png|381]]
![[../../attachments/Pasted image 20260325202952.png|395]]
Weak entity must have an arrow pointed to normal entity; The weak entity has a typical key called partial key, which is highlighted using dashed underline.
> [!PDF|109, 235, 109] [[../../attachments/chap02 ER模型(1) (1).pdf#page=68&annotation=13124R|chap02 ER模型(1), p.68]]
> > 弱实体集与强实体集之间是一对多的联系


#### Generalization & Specialization
Splits an entity (into more specified parts). A reversed triangle with 「ISA」written in it is introduced to handle this concept.
E.g. :
![[../../attachments/Pasted image 20260325214604.png|315]]
Three opposite features are emphasized in the generalization & specialization process:
- Hierarchy（层次结构） vs. Lattice（格结构）
- Disjoint（不相交的） vs. Overlapping（有重叠的）
- Total vs. Partial
![[../../attachments/Pasted image 20260325215256.png]]

Example of 1 (Lattice):
![[../../attachments/Pasted image 20260325215454.png|186]]
Example of 2&3:
![[../../attachments/Pasted image 20260325215418.png|399]]
#### Aggregation（聚集）
This.
![[../../attachments/Pasted image 20260325215630.png|383]]

### Conversion of E/R model to relational schema
Basically, E/R model is referred to that rectangles and lines thing I mentioned above, and relational schema is referred to a specific sheet which shows the attribute of certain entity or relation in E/R model.
A simplest example:
![[../../attachments/Pasted image 20260325220219.png|228]]
Rules:
- If the relational schema is conversed from a **normal entity** (i.e. no weak entity, no gen. & spe., no aggregation), then the sheet's column names are identical to that entity's attributes. 
- If the entity has **arrow(s)** pointing to other entities, then add those who are pointed's primary keys to attribute, as foreign keys.
- If …… is conversed from a **relation**, then add its related entities' primary key into sheet, both of them serves as primary key.
- If …… from a **weak entity**, then add the pointed entity's primary key to attribute, as a part of **primary** key.
- If …… from a **Generalization/Specialization**, then lower entity shall include higher entity's primary key. Specifically, if it is *disjoint and total,* then we don't need to form a sheet to higher entity, instead, lower entity shall *include all of the attributes* from higher entity.
- If …… from an **aggregation**, then …… omg pls just watch p126~127 of the powerpoint

Examples: (From page 113 to page 136.) It's important! Almost all of the homeworks derive from this topic
![[../../attachments/chap02 ER模型(1) (1).pdf#height=300&page=113]]


# Chapter 3: 关系模型

![[../../attachments/chap03 关系模型.pdf#height=100]]


Domain（域）：A set of values that have the same type.
For example, a set of integers

if multiple domains are 「multiplied」 together, then they form 「Car'tesian Product」（笛卡尔积）.
![[../../attachments/Pasted image 20260319102320.png|363]]

The subset of the Car'tesian product is called Relation（关系）.
Relation should not be meaningless.
![[../../attachments/Pasted image 20260319102652.png|357]]

The properties of relation: (Kinda abstract, no need to remember)
![[../../attachments/Pasted image 20260319104314.png|477]]

Note that no tuple in the relation could be replicated. Which means each tuple is unique. If we delete some properties(or one property), and then the tuples aren't unique anymore, then we call the deleted properties 「Candidate Key」（候选码）. Any property in a candidate key is a primary attribute（主属性）. One relation could have multiple candidate keys, and we could choose one of those candidate keys to designate is as the「Primary Key」(主码).

| 概念             | 能否唯一区分元组 | 说明                     |
| -------------- | -------- | ---------------------- |
| **候选码**        | ✅ 必须能    | 最小唯一标识组合               |
| **主码**（从候选码选的） | ✅ 必须能    | 实际使用的那个候选码             |
| **主属性**        | ❌ 不一定能   | 只是候选码中的某个属性，可能只是组合的一部分 |

As is shown in the picture, the primary keys are underlined. What's more, arrows pointing from one relation to another indicate foreign key relationships. If one property group from R is not in R's candidate keys, but it's S's candidate key (where S is another relation; usually also S's primary key), then this property group is called R's 「Foreign Key」（外码）.
For example: dean in relation DEPT is a foreign key referencing PROF.
![[../../attachments/Pasted image 20260319105650.png|530]]
Foreign keys have some interesting attributes:
![[../../attachments/Pasted image 20260319111748.png|443]]

Exercise:
![[../../attachments/Pasted image 20260319111906.png|439]]
Answer: 
1. no. primary key can't be null
2. no. primary key must be unique
3. yes.
4. yes.
5. no, 供应商号 is foreign key, due to reference integrity, relation S doesn't have T11 in its primary key, so can't

### Relational Algebra Operations
![[../../attachments/Pasted image 20260319112359.png|346]]

#### Basic Operations
***HYPERLINK HERE!!*** Click to watch:
[[../../attachments/chap03 关系模型.pdf#page=32|chap03 关系模型, p.32]]

![[../../attachments/Pasted image 20260319113740.png|623]]
![[../../attachments/Pasted image 20260319113757.png|623]]

Note:
Projection is $\Pi$ in powerpoint.
For difference operation, method 2 below is WRONG.
![[../../attachments/Pasted image 20260319113956.png|417]]


Image set: definition below
![[../../attachments/Pasted image 20260324155531.png|531]]




There has a division operand in operations.
$R(X, Y)\div S(Y)$ means to identify those X values in relation R that sustain associations with various Y values—specifically, with _every_ Y value present in relation S.
![[../../attachments/Pasted image 20260324163308.png|493]]

![[../../attachments/Pasted image 20260324163342.png|436]]


### Tuple Relational Calculus & Field Calculus

The calculation is based on lines of the table (i.e. tuple elements). E.g. below:
![[../../attachments/Pasted image 20260331152337.png|580]]

Relational operations can also be written in the form of relational calculus.E.g.:
![[../../attachments/Pasted image 20260331152810.png|294]]

There is another calculus called 「field calculus」（域关系演算）.
![[../../attachments/Pasted image 20260331153544.png|539]]

We can tell the difference and ***similarities*** of relational algebra, relational calculus and field calculus from this example below:
![[../../attachments/Pasted image 20260331153829.png|511]]



# Chapter 4.1: SQL 数据定义

![[../../attachments/chap04 SQL_数据定义.pdf#height=100]]

Data types:
- uniqueidentifier
- rowversion

##### Index
Index is supported by RowID, which is a pointer pointing to one row in the table.
![[../../attachments/Pasted image 20260402103758.png|376]]
The indexes in the file system are stored as  B+ tree format.
![[../../attachments/Pasted image 20260402103850.png|309]]
As a reminder, B+ tree's leaves only store data and their internal nodes only store indexes.

to create an index:
```mysql
create [unique] index index_name
on table_name (col_name [asc / desc][, col_name [asc / desc]...])
```

asc = ascend, where smaller data (index) is stored first
desc = descend

to delete (drop) an index:
```mysql
drop index index_name
```

we can specify(指定) how much the index page (索引页) is filled, using InnoDB_fill_factor. If we don't leave spaces for index pages, then it will cause the following:
![[../../attachments/Pasted image 20260402105119.png|385]]
Also, will cause index fragmentation:
![[../../attachments/Pasted image 20260402105129.png|390]]

There are other special indexes, let's introduce'em:

- Clustered index
The elements in the table are sorted by the indexed attibute's order and **physically** clustered on the disk. Only one for each table.
![[../../attachments/Pasted image 20260402105927.png|410]]

- Combined index
As its name suggests.
```mysql
create index combine_index_1 on R(A, B, C) 
```
where R is a table. 

- Covered index
wtf is this, no matter it's not important
![[../../attachments/Pasted image 20260402111958.png|199]]

- Filtering index
Yep we can use keyword  `where` when creating index.
![[../../attachments/Pasted image 20260402112304.png|362]]

- Function index
Function as a index. (maybe we should call it "FaaI")
![[../../attachments/Pasted image 20260402112717.png|330]]

##### View
![[../../attachments/Pasted image 20260402114605.png|332]]

```mysql
create view view_name
as
	(select col1, col2, ...
	 from table1, table2, ...
	 where xxx
	 and xxx
	)
```


# Chapter 4.2: SQL数据查询

![[../../attachments/chap04 SQL_数据查询.pdf#height=75]]

Basic structure of data query:
```mysql
select col
from table
[where query]
```

![[../../attachments/Pasted image 20260402115428.png|339]]
![[../../attachments/Pasted image 20260402115442.png|360]]


| Operation name      | Expression              | SQL                                                                |
| ------------------- | ----------------------- | ------------------------------------------------------------------ |
| **Rename**          | $\rho_{S1}(SC)$         | Method 1: `FROM SC AS S1`...<br>Method 2: `FROM SC S1`...          |
| **Selection**       | $\sigma_{condition}(R)$ | `SELECT * FROM R WHERE condition`                                  |
| **Projection**      | $\Pi_{A,B}(R)$          | `SELECT DISTINCT A, B FROM R`                                      |
| **Union**           | $R \cup S$              | `SELECT * FROM R UNION SELECT * FROM S`                            |
| Difference          | $R - S$                 | `SELECT * FROM R EXCEPT SELECT * FROM S`                           |
| **Intersection**    | $R \cap S$              | `SELECT * FROM R INTERSECT SELECT * FROM S`                        |
| Cartesian Product   | $R \times S$            | `SELECT * FROM R, S` (no join condition)                           |
| Natural Join        | $R \bowtie S$           | `SELECT * FROM R NATURAL JOIN S`                                   |
| **Theta Join**      | $R \bowtie_{\theta} S$  | `SELECT * FROM R JOIN S ON condition`                              |
| Equi-Join           | $R \bowtie_{R.A=S.B} S$ | `SELECT * FROM R JOIN S ON R.A = S.B`                              |
| **Left Outer Join** | $R \ ⟕ \ S$             | `SELECT * FROM R LEFT JOIN S ON condition`                         |
| Right Outer Join    | $R \ ⟖ \ S$             | `SELECT * FROM R RIGHT JOIN S ON condition`                        |
| Full Outer Join     | $R \ ⟗ \ S$             | `SELECT * FROM R FULL OUTER JOIN S ON condition`                   |
| Semi-Join           | $R \ltimes S$           | `SELECT * FROM R WHERE EXISTS (SELECT 1 FROM S WHERE ...)`         |
| Division            | $R \div S$              | Complex; finds all tuples in R associated with **all** tuples in S |

#### null
It's easy to understand. NULL means that the value is unknown. The value of expression 「 `TRUE` `AND` `UNKNOWN` 」 is unknown because you don't know whether that "unknown" value is True or not. So the result remains unknown.
![[../../attachments/Pasted image 20260407152859.png|460]]

In a `SELECT ... FROM` statement, if the expression following `FROM` evaluates to `UNKNOWN` (rather than `TRUE` or `FALSE`), it is treated as `FALSE`.

Example:
![[../../attachments/Pasted image 20260407153627.png|374]]

we can use `isnull(expression)` to tell whether the expression is null or not. For example. `isnull(1/0) = 1`.

#### Implementing Division
![[../../attachments/Pasted image 20260407155553.png|405]]

#### join and set operations
join:

| Natural Join        | $R \bowtie S$           | `SELECT * FROM R NATURAL JOIN S`            |
| ------------------- | ----------------------- | ------------------------------------------- |
| **Theta Join**      | $R \bowtie_{\theta} S$  | `SELECT * FROM R JOIN S ON condition`       |
| Equi-Join           | $R \bowtie_{R.A=S.B} S$ | `SELECT * FROM R JOIN S ON R.A = S.B`       |
| **Left Outer Join** | $R \ ⟕ \ S$             | `SELECT * FROM R LEFT JOIN S ON condition`  |
| Right Outer Join    | $R \ ⟖ \ S$             | `SELECT * FROM R RIGHT JOIN S ON condition` |
set operations:

| **Union**           | $R \cup S$              | `SELECT * FROM R UNION SELECT * FROM S`                            |
| ------------------- | ----------------------- | ------------------------------------------------------------------ |
| Difference          | $R - S$                 | `SELECT * FROM R EXCEPT SELECT * FROM S`                           |
| **Intersection**    | $R \cap S$              | `SELECT * FROM R INTERSECT SELECT * FROM S`                        |
#### Aggregate function
The most common mistake:
![[../../attachments/Pasted image 20260407155939.png|166]]
Correct version:
```mysql
select sno
from SC
where grade = 
	(select max(grade)
	from SC)
```

#### group by
![[../../attachments/Pasted image 20260407162053.png|450]]
Q: Why?
A: Because SQL's execution order is: `where` -> `group by` -> `having`. `where` gets excuted first。

`group by` clause can be followed by these expressions: `with cube`, `with rollup`, 



# Chapter 4.3: SQL 数据更新
![[../../attachments/chap04 SQL_数据更新.pdf#height=50]]

### Update
```sql
insert into table_name
values (x, y, z ...),
       (a, b, c ...);
```

```sql
select (rows)
into table_name
from (subquery)
```
subquery（子查询） is a kind of query.

### Delete
Note that if you want to delete all the rows in the table, just write `delete from table_name`. It will ***preserve*** column names. However, this method is not as fast as `truncate table table_name`.
```sql
delete from table_name
where (conditional expressions ...)
```

Example:
![[../../attachments/Pasted image 20260414153849.png|491]]

#### Correctly using aggregate function with delete
Page 12-15
![[../../attachments/chap04 SQL_数据更新.pdf#height=50&page=12]]
Hint: using temporary table (with tmp as).

### Update

```sql
update table_name
set col_name = expression / subquery
    ...
[where conditional expressions ...]
```

Example:
![[../../attachments/Pasted image 20260414154412.png|452]]

we can use `case ... when ...` expression to handle different conditions. Eg.:
![[../../attachments/Pasted image 20260414154605.png|393]]


### Upsert
Upsert = Update + Insert.


# Chapter 4.4: SQL 服务器端脚本语言

![[../../attachments/chap04 SQL_服务器端脚本语言.pdf#height=50]]


略



# Chapter 5: 数据完整性

![[../../attachments/chap05 SQL_完整性与安全性.pdf#height=50]]



Add a constraint
```sql
alter table table_name add constraint
	contraint_name constraint_details
```

Delete a constraint
```sql
alter table table_name drop constraint constraint_name
```

foreign key has 3 constraint types: `RESTRICT`, `CASCADE`, `SET NULL`

For restrict, if you want to delete a row in a certain table, where this table's primary key is another table's foreign key, then you CAN'T delete/alter the row if the row's primary key is in the foreign keys.
![[../../attachments/Pasted image 20260416102520.png|447]]
![[../../attachments/Pasted image 20260416102533.png|446]]


##### Constraint check & Deferred constraints
![[../../attachments/Pasted image 20260416102929.png|436]]
![[../../attachments/Pasted image 20260416102942.png|406]]

### Database Security
**Principal(主体):** Objects that can be granted permissions to access specific database objects, including login users, roles, and applications.
```sql
create user user_name
```

**Permission（权限）:** Allows principal to perform operations on a securable（安全对象）.

##### Authorization graph & commands
![[../../attachments/Pasted image 20260416104233.png|423]]


Authorization commands:
![[../../attachments/Pasted image 20260416104658.png|387]]
![[../../attachments/Pasted image 20260416104709.png|382]]


##### Defining principals as roles(角色)
Roles can be seen as a middle layer.
![[../../attachments/Pasted image 20260416104851.png|421]]
It helps database to grant permissions more conveniently
```sql
create role role_name
```

How do we assign(分配) the permissions? There are two ways. First we can let high-level principals to grant permissions freely to low-level principals, like the authorization graph above. This is called Discretionary Access Control (DAC, 自主访问控制). Another way is to rank the objects' levels, e.g. top secret, secret, classified, which often appears in video games. This is Mandatory Access Control (MAC，强制访问控制).

**Audit(审计):** Monitor and record operations of specified users in the database to review user activities (security).

##### SQL Injection
![[../../attachments/Pasted image 20260416110048.png|318]]



# Chapter 6: 关系中的多模态数据
![[../../attachments/chap06 关系中的多模态数据.pdf#height=50]]

Relation Database's creators want to achieve an ultimate goal: Save all kind of data into the database. So we have more and more data types nowadays. This chapter we dive into those data types.


### Recursion Search
![[../../attachments/Pasted image 20260416114349.png|374]]

![[../../attachments/Pasted image 20260416114358.png|231]]


### Rolling Window Query (滑动窗口查询)
uses partition by ... .
![[../../attachments/Pasted image 20260416115717.png|526]]

Example Below:
![[../../attachments/Pasted image 20260416115734.png|546]]


### Storing XML Data in SQL
XML looks like this:

![[../../attachments/Pasted image 20260421152123.png|382]]
XML has two main parts: tag, and elements, where elements are surrounded with <>.

If we translate XML into SQL data format, it might be **too long** if we store every element in the XML **in a column**. Example below:
![[../../attachments/Pasted image 20260421152357.png|420]]

So we use a triple tuple（三元组） to save XML. We can create a table with three columns: `Subject`, `Property` and `Object`.

![[../../attachments/Pasted image 20260421152707.png|394]]



### Storing JSON in SQL

Again, JSON looks like this:
![[../../attachments/Pasted image 20260421153838.png|446]]


Return the values as a JSON array
```sql
json_array(val[,val]...) 
```
![[../../attachments/Pasted image 20260421153815.png|279]]

Return `key:value` as a JSON object
```sql
json_object(key, val[, key, val]...)
```
![[../../attachments/Pasted image 20260421154306.png|279]]

We can combine these two functions, example below:
![[../../attachments/Pasted image 20260421154443.png|401]]
In this way, we can create a nested JSON object.

There is a json data type in mysql. It's name is literally `json`.
![[../../attachments/Pasted image 20260421154643.png|452]]

#### Extracting Values from JSON
To pull scalar values or sub-documents out of a JSON column, use `json_extract` with JSON path syntax.

```sql
json_extract(json_doc, path[, path]...)
```
![[../../attachments/Pasted image 20260421160658.png|513]]
MySQL also provides the `->` and `->>` operators as shorthand:

- `column->'$.key'` — returns the JSON fragment (equivalent to `JSON_EXTRACT`)
![[../../attachments/Pasted image 20260421160556.png|373]]

- `column->>'$.key'` — returns the unquoted string (equivalent to `JSON_UNQUOTE(JSON_EXTRACT(...))`)
#### Converting JSON to Rows — `JSON_TABLE`

`JSON_TABLE` is the SQL standard way to turn a JSON document into a relational result set (the SQL equivalent of **unwind**).

```sql
json_table(json_doc, path COLUMNS (column_list))
```

![[../../attachments/Pasted image 20260421161523.png|562]]
My understanding:
in `column_list`, there are multiple extraction methods, the three ways shown in picture are `path`, `json path`, `exists path`. The format `col_name EXTRACT_METHOD` is how column_list is formed.

What's more:

You specify the array path (`$[*]`) and define the columns you want to extract.
- `$` = the root document.
- `[*]` = every element in the array at that level.  
So `$[*]` means _iterate over each object in the top-level array_.

**`aj json path "$.a"`** — keeps the result as raw JSON. That's why row 1 shows `"3"` (with quotes) while `ac` shows `3` (string cast to plain text).

| rowid | Source object | How `ac` gets its value                                                                         | How `aj` gets its value                           | How `bx` gets its value               |
| ----- | ------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------- |
| **1** | `{"a":"3"}`   | `$.a` → JSON string `"3"`. Cast to `varchar` → `3`                                              | `$.a` → JSON string `"3"`. Stored as JSON → `"3"` | `$.b` does not exist → `0`            |
| **2** | `{"a":2}`     | `$.a` → number `2`. Cast to `varchar` → `2`                                                     | `$.a` → number `2`. Stored as JSON → `2`          | `$.b` does not exist → `0`            |
| **3** | `{"b":1}`     | `$.a` missing → **empty** → default `'111'`                                                     | `$.a` missing → **empty** → default `{"x": 333}`  | `$.b` **exists** (value is `1`) → `1` |
| **4** | `{"a":0}`     | `$.a` → number `0`. Cast to `varchar` → `0`                                                     | `$.a` → number `0`. Stored as JSON → `0`          | `$.b` does not exist → `0`            |
| **5** | `{"a":[1,2]}` | `$.a` → JSON array `[1,2]`. Cannot cast array to scalar `varchar` → **error** → default `'999'` | `$.a` → JSON array `[1,2]`. Valid JSON → `[1, 2]` | `$.b` does not exist → `0`            |

#### Unwinding Nested Arrays (Important)
To **unwind** a nested JSON array (e.g., an array inside each object), use `NESTED PATH` inside `JSON_TABLE`. This creates a lateral join automatically.

```sql
SELECT * FROM JSON_TABLE(
  '{"order_id":1,"items":[{"sku":"A1","qty":2},{"sku":"B2","qty":1}]}',
  '$' COLUMNS (
    order_id INT PATH '$.order_id',
    NESTED PATH '$.items[*]' COLUMNS (
      sku VARCHAR(10) PATH '$.sku',
      qty INT         PATH '$.qty'
    )
  )
) AS jt;
```

You can also add `FOR ORDINALITY` to capture the array index.


### Matching strings

1. use `like`
2. use regexp
![[../../attachments/Pasted image 20260421155009.png|576]]


### Vector and Vector Database
omitted

# Chapter 7: 关系规范化
![[../../attachments/chap07 关系规范化.pdf#height=50]]

![[../../attachments/Pasted image 20260421163435.png|513]]


### Function Dependency
![[../../attachments/Pasted image 20260421165818.png|422]]
Don't be intimidated by the definition. It is essentially the same as that of a mathematical function: for any given X, there is only one corresponding Y value. If so, we call it as X->Y.
#### Fully functionally dependent
If X->Y, and for any proper subset (真子集) of X' of X,  has $X'\nrightarrow Y$ , then Y is **fully functionally dependent** (完全函数依赖) on X, denoted as $X \xrightarrow{f} Y$.
#### Partially functionally dependent
Otherwise: $X \xrightarrow{p} Y$. (**partially functionally dependent, 部分函数依赖**)
For example, if $AB\to C$, and $A\nrightarrow C$, then $AB \xrightarrow{p} C$. We'll eliminate all of the partially dependencies in 2NF.
#### Transitive Dependency Causes Problem
![[../../attachments/Pasted image 20260428152452.png|422]]
Transitive Dependency occurs when $X\to Y, Y\to Z , y\nrightarrow X$ and $Z \subsetneqq Y$

This kind of dependency will cause problems, for the instances, ckeck NF1 (just below).
### Normal Form
(I found my English sucks and Chen is passing these beamers so quickly, so I used AI)

Think of Normal Forms (NFs) as **levels of "cleanliness"** for a database table. Each higher level fixes specific problems and removes unnecessary data connections (dependencies). The slides show them as steps: **1NF → 2NF → 3NF → BCNF → 4NF → 5NF**. Each step is stricter than the one before it.
![[../../attachments/Pasted image 20260430103612.png|544]]
#### 1NF
You just put all the data in one table. For example:
![[../../attachments/Pasted image 20260428154051.png|378]]
The primary keys are sno and cno. (Note: Dean means 系主任)

#### Why 1NF Is Not Enough: The "Anomalies"

Even if a table is in 1NF, it can still be badly designed. The slides use this student table:

|sno|sname|dno|dean|cno|grade|
|:-:|:--|:--|:--|:--|:--|
|S01|Yang Ming|D01|Si Qi|C01|90|
|S01|Yang Ming|D01|Si Qi|C02|92|
|S02|Li Wan|D01|Si Qi|C01|87|

Because the primary key is `(sno, cno)`, student info (`sname`, `dno`, `dean`) depends on only **part** of the key (`sno`). This causes four problems:

1. **Insert anomaly:** If a student hasn't chosen any course yet, you cannot add them because `cno` (part of the key) would be empty.
2. **Delete anomaly:** If you delete a student's only course record, you accidentally delete their personal info too.
3. **Update anomaly:** If a student changes departments, you must change every single row for every course they take.
4. **Data redundancy:** The department name (`dean`) is repeated again and again for the same student.
![[../../attachments/Pasted image 20260428155913.png|402]]
#### 2NF
Solve the problem above by restricting tables with this rule:
**Eliminate** non-key attributes' **partial dependency** to candidate key(s).(消除非主属性对候选码的**部分**依赖)
In the word non-key, the "key" refers to candidate key——you use candidate key(s) to uniquely identify one row in a table. E.g. the combination of (sno, dno) in the table above, they can uniquely identify one line. But sname only depends on sno, which is a partial dependency. So we split the original table:
![[../../attachments/Pasted image 20260428154645.png|374]]
**Rule:** A table is in 2NF if it is already in 1NF **and** every non-key attribute depends on the **whole** primary key, not just a part of it.

However 2NF also causes anomalies:
![[../../attachments/Pasted image 20260428160006.png|453]]

#### 3NF
**Eliminate** non-key attributes' **transitive dependency** to candidate key(s).(消除非主属性对候选码的**传递**依赖)
![[../../attachments/Pasted image 20260428161609.png|416]]

E.g. below is a transitive dependency, so we further split the table into 2 parts:
![[../../attachments/Pasted image 20260428161738.png|318]]
![[../../attachments/Pasted image 20260428161830.png|390]]

It is trivial that 3NF must have some problems, otherwise there wouldn't have BCNF, 4NF and 5NF. Let's check this example below:
![[../../attachments/Pasted image 20260428162535.png|389]]

In this case, (sno, tno) and (sno, cno) are both candidate keys. So STC is 3NF. The problems lie in this structure.
![[../../attachments/Pasted image 20260428162818.png|411]]
![[../../attachments/Pasted image 20260428162844.png|392]]

So here we introduce BCNF:

#### BCNF
Every attribute is directly determined by key. (key also means candidate key(s) here.)
![[../../attachments/Pasted image 20260428163005.png|372]]
We can alternate the table into this form:
![[../../attachments/Pasted image 20260428163108.png|509]]

Note that higher form isn't always good, because it makes table much more chopped.

#### Multiple Values Dependency     A->->B

If we expand this one-line non-1NF table, it will turn into a huge, 8-line table:
![[../../attachments/Pasted image 20260428163847.png|460]]
This is horribly redundant! How to optimize it?

Firstly let's see what is multiple values dependency. We use image set to define it, so review comes here:
![[../../attachments/Pasted image 20260324155531.png|373]]

![[../../attachments/Pasted image 20260428165341.png|371]]

In this case, we have cno->->tno, and cno->->bno. Because for any cno (in this case only c1) as x, and for any bno as z, we have $Y_{xz} = Y_x$ , supposing Y as tno.

*Note: intuitively, U are the column names in the table.*

##### Relationship between Multi-views and Function Dependency
![[../../attachments/Pasted image 20260430101334.png|368]]
![[../../attachments/Pasted image 20260430103442.png|334]]
##### Understanding Multiple values Dependency
An **Important** intuitive perspective:
![[../../attachments/Pasted image 20260430101602.png|416]]

The conclusion below is based on that X or Y have multiple attributes (still, intuitively, they include multiple column names).
![[../../attachments/Pasted image 20260430102351.png|403]]
![[../../attachments/Pasted image 20260430102742.png|437]]
For Example,
![[../../attachments/Pasted image 20260430102809.png|424]]


#### 4NF
![[../../attachments/Pasted image 20260430102913.png|374]]
Non-4NF database will cause an amount of data redundancy.


*Note:no need to know 5NF*


### Infering New Function Dependencies From known Dependencies

Let $F=\{A\to B, B\to C\}$. We want to know whether A->C is right or not. Firstly we make some definition:

Logical Implication
![[../../attachments/Pasted image 20260430104603.png|460]]

#### Armstrong Axiom System

The last 3 axioms can be inferred from the first 3 axioms.
![[../../attachments/Pasted image 20260430104731.png|281]]
*Note: Due to reflexivity, we know that: $A\subseteq AB$, so $(A,B)\to A$. This is an universal law.*
*Note: It's clear that if $A\to BCD$, then $A\to B$, $A\to C$, and $A\to D$ hold (成立) simultaneously.*

#### Attribute Set's Closure (属性集的闭包)


![[../../attachments/Pasted image 20260430105223.png|410]]

We calculate the closure step by step, every time the closure is changed, we check the whole closure again and see if there will have any new dependencies in the closure.

The pic below calculates $(AG)_F^+$. It initializes the closure by "itself", using reflexivity (自反律). Then it's able to enlarge the closure.
![[../../attachments/Pasted image 20260430105807.png|327]]

Intuitively, $(AG)_F^+ = AGBCHI$ means that AG->A, AG->B, ……, AG->I.
![[../../attachments/Pasted image 20260430111408.png|481]]

#### Calculate Candidate Key using the Axiom
Still, let's review candidate key's definition:
> ![[../../attachments/Pasted image 20260430112245.png]]

Then we get these attribute sets' classifications & features:
![[../../attachments/Pasted image 20260430112408.png|435]]

##### Calculation Examples  (Important)
[[../../attachments/chap07 关系规范化.pdf#page=116|chap07 关系规范化, p.116]]

*Note: Why we call this algorithm as "calculating candidate key"? That's because, if an attribute set's closure includes all of the attributes (e.g. $(AE)^+_F=ABCDE$  and A~E are all of the attributes), then it is a candidate key if it minimizes itself (e.g. $(AE)^+_F=ABCDE$ but $(A)^+_F\neq ABCDE$.) *



### Mode Decomposition

We want to break the table into multiple parts, to let each part satisfies higher NFs.

E.g.: (Note, decomposition 4 is right)
![[../../attachments/Pasted image 20260512155930.png|440]]

For decomposition 1, we lost attribute D; for 2, we created a useless relation R3(BD); for 3, which is important, **we missed the dependency $A\to C$ .** Since A->B and B->C, we know there is a dependency A->C through armstrong axiom.**What's more, we have to write each possible dependency out in these decompositions**, so adding dependency $\{A\to C\}$ into $R_2$ makes it the right answer (As decomposition 4).

The「writing each possible dependency out」in mode decomposition has a term: projection.
![[../../attachments/Pasted image 20260512160800.png|315]]


The impossible triangle in NF increment
![[../../attachments/Pasted image 20260512161649.png|735]]

#### Decomposition

![[../../attachments/ChatGPT Image 2026年5月17日 13_28_48.png|519]]
#### Decompose to BCNF

![[../../attachments/Pasted image 20260512164250.png|505]]
But this will lost some function dependencies.


![[../../attachments/Pasted image 20260512165829.png|528]]

# Chapter 8: 事务

![[../../attachments/chap08 事务.pdf#height=50]]

### Transcation

**Transcation (事务)** is like primitive (原语) in OS. One transaction includes a bunch of operations, these operations must be performed **without interruption**. If interrupted, the whole transaction will rollback, which means it will fail, stop the whole transaction, and the whole database will rollback to the status before the transaction started.

![[../../attachments/Pasted image 20260514104039.png|386]]

Transaction starts with `Begin transcation`, ends with `Commit transaction` or `Rollback transcation`. 


### ACID

- Atomicity \[ˌætəmˈɪsɪti\] - like primitive
- Consistency - wtf is this, maybe database consistency
- Isolation - transaction A won't be affected by another transaction B - *Concurrency (并发)*
- Durability - once committed, becomes permanent

compare consistency with integrity constraints:
![[../../attachments/Pasted image 20260514104914.png|639]]


### Transaction Scheduling

![[../../attachments/Pasted image 20260514111016.png|432]]

Serial vs. Concurrent
![[../../attachments/Pasted image 20260514111108.png|484]]
Answer:
$$
\frac{(\sum k_i)!}{\Pi(k_i!)}
$$
Concurrent schedule is fast, but it might break database consistency. For example: [[../../attachments/chap08 事务.pdf#page=31|chap08 事务, p.31]], from page 31 to page 36

#### Restorable & Cascadeless Schedule

What if we do a `read(A)` in T2 after T1 did a `write(A)`, and T1 wants to rollback after T2 commited? Due to transaction durability, we can't re-rollback a commited transaction.
![[../../attachments/Pasted image 20260514112616.png|201]]
This kind of transaction is called non-restorable schedule (不可恢复的调度). It ... is just wrong. Our transactions should be restorable ones, which means:

For each transaction pair T1 and T2, if **T2 reads data written by T1**, then **T1 must commit before T2**.

There is a stricter rule called **cascadeless schedule (无级联调度)**. First let's check this example:
![[../../attachments/Pasted image 20260514113533.png|260]]
Surely T2 didn't commit before T1 rollbacked, but T3 still read the dirty data (脏数据). It is called cascade schedule. To avoid this this problem, cascadeless schedule requires:

For each transaction pair T1 and T2, if **T2 reads data written by T1**, then **T1 must commit before T2 *reads data***.

### Inconsistency in Concurrent Schedule

ChatGPT Image is just too OP...

![[../../attachments/ChatGPT Image 2026年5月14日 11_53_45.png|610]]
***NOTE! The table above is wrong, read committed cannot eliminate lost update. The correct version is as below:***

![[../../attachments/Pasted image 20260519151924.png|379]]
The isolation levels are introduced below.

![[../../attachments/Pasted image 20260514120002.png|456]]
It's repeated in class that read committed level's S-lock (i.e. read-lock) is a short lock (短锁), which means that the read operation immediately releases S-lock after read.
![[../../attachments/Pasted image 20260526152400.png|267]]

![[../../attachments/Pasted image 20260519153317.png|610]]




### Snapshot Isolation

![[../../attachments/Pasted image 20260519153816.png|473]]




### Transcation Serializability (事务可串行化)

Multiple transactions happens concurrently (suppose 2 transactions $T_1$ and $T_2$ here), if our execution order is **equivalent to one of the serialized orders** (e.g. $T_1$ has two steps $t_{11}$ and $t_{12}$, $T_2$ has two steps $t_{21}$ and $t_{22}$, and $t_{11},t_{21},t_{12},t_{22}$ is equivalent to $T_1,T_2$), then it has serializability.

Now we want to know: given an execution order $S$ (meaning: serial), if $S$ is serializable or not.
![[../../attachments/Pasted image 20260526151724.png|474]]
#### Conflict Equivalent & 

If $S$ includes **two different transactions that read/write the same data**, and **at least one of these instructions on that data is "write"**, then these instructions are called conflict instructions.

If $S$ 
- definition
- precedence graph
- conflict serializability & transaction serializability


#### View Equivalent
- definition
- read-from consistency (从读一致性)
- tagged priority graph


# Chapter 9: 并发控制

![[../../attachments/chap09 并发控制.pdf#height=50]]


### Two-Phase Locking Protocol
![[../../attachments/Pasted image 20260526152722.png|404]]

This protocol guarantees serializability.
![[../../attachments/Pasted image 20260526153011.png|448]]
proof: skipped.

### Lock Types
![[../../attachments/Pasted image 20260526154228.png|328]]

Review: X-lock => write, S-lock => read.

![[../../attachments/Pasted image 20260526154604.png|201]]
This table means that if you add a S-lock to certain data, then you can add another S-lock (that, is $comp(S,S)=True$), but cannot add X-lock. 

#### Upgrading Lock type and U-lock

Suggest that we have an at-least repeatable-read database, which **S-locks are long locks**, and:

We got this transaction serial below, where **T1 reads a1, and then writes it**; T2 reads a1, and commits. Since our S-locks are long locks, T1 can't add another X-lock to a1. Thus, T1 can't even finish its task.
![[../../attachments/Pasted image 20260526155428.png|537]]
What if we add a X-lock for T1 when it reads a1 (as above)? Apparently it is illegal, and it's slow, since T2 is waiting all the time.

Actually, we could upgrade T1's S-lock to X-lock when it writes a1. That is called *upgrading the lock*. Reversely, we can *downgrade* a X-lock to S-lock.

But this still causes problems. 
![[../../attachments/Pasted image 20260526160828.png|394]]
When both of the transactions require write after read, then **deadlock** happens. This is a new problem where wouldn't happen when T1 is write after read and T2 reads-only.

Thus we introduce U-lock, which is abbr. of Update lock:

![[../../attachments/Pasted image 20260526161230.png|288]]
When a transaction T1 reads a1 now, and **will** write a1 **in the future**, then we add a U-lock when T1 reads a1. And when we write a1, we **translate** the lock into X-lock.
![[../../attachments/Pasted image 20260526161705.png|244]]
U-locks and U-locks are incompatible, which is the core difference from S-locks and S-locks.

#### Lock Granularity (封锁粒度) and I-lock family

We can only add a lock on a row, for example when we upgrade a certain row;
Or we can add a lock on the entire table, e.g. when `alter table name`.
![[../../attachments/Pasted image 20260526162708.png|348]] (Because Tsinghua University has more boys, you are welcome.)

![[../../attachments/Pasted image 20260526163014.png|401]]
When transactions with different granularity concurrent, many conflicts will happen. As it shown above, if we change page1 and read row1 simultaneously, the database wouldn't know the relationship between page1 and row1, so these two locks wouldn't affect each other - which is not a good situation.

To solve this problem, we introduce another lock type - Intend lock 「I-lock」.
![[../../attachments/Pasted image 20260526163756.png|480]]

![[../../attachments/Pasted image 20260526163820.png|261]]
Question: Why I and I are compatible?
Answer: e.g. 
![[../../attachments/Pasted image 20260526164103.png|161]]
What's more, in order to prevent this↓,
![[../../attachments/Pasted image 20260526164419.png|224]]
we can clarify intend lock's types for father nodes:
- IS lock - one of its son nodes has S lock
- IX lock - one of its son nodes has X lock

![[../../attachments/Pasted image 20260526164504.png|277]]

#### Solving phantom: key-range lock

![[../../attachments/Pasted image 20260526165516.png|292]] 

![[../../attachments/Pasted image 20260526165539.png|357]]
![[../../attachments/Pasted image 20260526165553.png|357]]

### Problems that locks introduces

blocking, deadlock, livelock



