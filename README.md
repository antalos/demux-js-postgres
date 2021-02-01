# demux-js-postgres [![Build Status](https://travis-ci.org/EOSIO/demux-js-postgres.svg?branch=develop)](https://travis-ci.org/EOSIO/demux-js-postgres)

## Fork reason
- we've failed to get project running with package versions 4.0.1, 4.0.2 version, while it was working @ 5.0.2
- the original package has not been published to npm (https://github.com/EOSIO/demux-js-postgres), was forked from /develop branch @ 5.0.2 version (commit c7cd9ffa43c60b8a4205c34f6f1421cc39d2a37a)
- massive has been updated to 6.6.5


## Installation

```bash
# Using yarn
yarn add demux-postgres
yarn add massive

# Using npm
npm install demux-postgres --save
npm install massive --save
```

## Usage

### MassiveActionHandler

The `MassiveActionHandler` uses [massive-js](https://github.com/dmfay/massive-js) to interact with a Postgres database for storing internal demux state and state calculated by Updaters. Rollback of state due to forks is supported by committing all database writes to per-block databases transactions, and utilizing [Cyan Audit](https://bitbucket.org/neadwerx/cyanaudit/overview) to reverse those transactions in reverse order when needed.

#### Setup

In order to instantiate a `MassiveActionHandler`, four arguments are needed:

- `handlerVersions`: This is an array of `HandlerVersion`s. For more information, [see the `demux-js` documentation](https://eosio.github.io/demux-js/classes/abstractactionhandler.html#applyupdaters). 

- `massiveInstance`: A connected massive database connection object. demux-js-postgress requires that you have a Postgres server running version 9.6 or greater. For more information on how to configure and instantiate this object, see the [massivejs documentation](https://github.com/dmfay/massive-js#connecting-to-a-database).

- `dbSchema`: The name of the schema we will operate in.

- `migrationSequences`: *(See next section below)*

#### Migrations

The `MassiveActionHandler` will manage all of the Postgres migrations relevant to demux operations. In addition to setting up all internal requirements (idempotently creating the specified `dbSchema` and required internal tables, installing/activating Cyan Audit), you may create additional migrations that run either at initial setup, or are triggered by an action at some point in the future. This is done by writing your migrations as SQL files, loading them via the `Migration` constructor, and collecting them into an array of `MigrationSequence`s:

*create_todo_table.sql*
```sql
CREATE TABLE ${schema~}.todo (
  id int PRIMARY KEY,
  name text NOT NULL
);
```

*migrationSequences.js*
```javascript
import { Migration } from "demux-postgres"

const createTodoTable = new Migration(
  "createTodoTable", // name
  "myschema", // schema
  "create_todo_table.sql", // SQL file
)

// MigrationSequence[]
// See: https://github.com/EOSIO/demux-js-postgres/blob/develop/src/interfaces.ts
module.exports = [{
  migrations: [createTodoTable],
  sequenceName: "init"
}]
```

You can then use this object for the `migrationSequences` argument of the `MassiveActionHandler` constructor.

Once you have instantiated the `MassiveActionHandler`, you can set up your database via the `setupDatabase()` method. If you have a `MigrationSequence` with the name `"init"`, then this migration sequence will run after all other internal database setup is finished.

It can be useful to trigger migrations from actions (for example, when a contract updates), much in the same way it is useful to [update HandlerVersions](https://eosio.github.io/demux-js/classes/abstractactionhandler.html#applyupdaters). You may do this from an Updater's `apply` function via `db.migrate(<MigrationSequence.sequenceName>)`:

```javascript
async function migrateDatabase(db, payload) {
  await db.migrate(payload.sequenceName) // Blockchain will determine when and what migrations will run
}
```

This is also important for maintaining determinism of data (e.g. during replays) if schema changes are needed.

### Example

```javascript
const { BaseActionWatcher } = require("demux")
const { MassiveActionHandler } = require("demux-postgres")
const { NodeosActionReader } = require("demux-eos") // Or any other compatible Action Reader

const massive = require("massive")

// See https://eosio.github.io/demux-js/ for info on Handler Versions, Updaters, and Effects
const handlerVersions = require("./handlerVersions") // Import your handler versions

// See "Migrations" section above
const migrationSequences = require("./migrationSequences")

// See https://dmfay.github.io/massive-js/connecting.html for info on massive configuration
const dbConfig = { ... }

massive(dbConfig).then((db) => {
  const actionReader = new NodeosActionReader("http://my-node-endpoint", 0)
  const actionHandler = new MassiveActionHandler(
    handlerVersions,
    db,
    dbConfig.schema,
    migrationSequences
  )
  const actionWatcher = new BaseActionWatcher(actionReader, actionHander, 500)
  actionWatcher.watch()
})
```
