const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class statemine1639404748586 {
    name = 'statemine1639404748586'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "amount" numeric, "to" text, "from" text, "delegator" text, "fee" numeric, "type" character varying(9) NOT NULL, "extrinisic_id" text, "success" boolean NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "block_hash" text NOT NULL, "block_num" integer NOT NULL, "asset_id" character varying, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e818cd083f48ed773afe017f7c" ON "transfer" ("asset_id") `);
        await queryRunner.query(`CREATE TABLE "unique_class" ("id" character varying NOT NULL, "owner" text, "admin" text, "issuer" text, "creator" text, "freezer" text, "total_deposit" numeric, "name" text, "status" character varying(9) NOT NULL, CONSTRAINT "PK_3709d5e3a17fbd4901c0aaa1487" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "unique_transfer" ("id" character varying NOT NULL, "to" text, "from" text, "delegator" text, "fee" numeric, "type" character varying(9) NOT NULL, "extrinisic_id" text, "success" boolean NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "block_hash" text NOT NULL, "block_num" integer NOT NULL, "unique_class_id" character varying, "unique_instance_id" character varying, CONSTRAINT "PK_7d6ae97266747834d3e832cb8fc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_008d9f4e0b30b62b439b092d21" ON "unique_transfer" ("unique_class_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_09165fa651ab2faa61f64c8891" ON "unique_transfer" ("unique_instance_id") `);
        await queryRunner.query(`CREATE TABLE "unique_instance" ("id" character varying NOT NULL, "inner_id" text NOT NULL, "status" character varying(9) NOT NULL, "deposit" numeric, "unique_class_id" character varying NOT NULL, "owner_id" character varying NOT NULL, CONSTRAINT "PK_f7c8a41b5a9d0e3eeb5ab3871b0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_afece6c4021225065d4c4112e9" ON "unique_instance" ("unique_class_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_aa027c94b1903ff9271fea05e0" ON "unique_instance" ("owner_id") `);
        await queryRunner.query(`CREATE TABLE "historical_balance" ("id" character varying NOT NULL, "balance" numeric NOT NULL, "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL, "account_id" character varying NOT NULL, CONSTRAINT "PK_74ac29ad0bdffb6d1281a1e17e8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_383ff006e4b59db91d32cb891e" ON "historical_balance" ("account_id") `);
        await queryRunner.query(`CREATE TABLE "account" ("id" character varying NOT NULL, "wallet" text NOT NULL, "balance" numeric NOT NULL, CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "asset_balance" ("id" character varying NOT NULL, "balance" numeric NOT NULL, "status" character varying(9) NOT NULL, "account_id" character varying NOT NULL, "asset_id" character varying NOT NULL, CONSTRAINT "PK_7ffc793d0d7d680c10e4741f173" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_55a3340913f4ffe21ffaa0e051" ON "asset_balance" ("account_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b3bbf183209c65d4306a85a06c" ON "asset_balance" ("asset_id") `);
        await queryRunner.query(`CREATE TABLE "asset" ("id" character varying NOT NULL, "name" text, "symbol" text, "freezer" text, "decimal" integer, "owner" text NOT NULL, "admin" text, "issuer" text, "creator" text, "min_balance" numeric, "status" character varying(9) NOT NULL, "total_supply" numeric, CONSTRAINT "PK_1209d107fe21482beaea51b745e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "transfer" ADD CONSTRAINT "FK_e818cd083f48ed773afe017f7c0" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unique_transfer" ADD CONSTRAINT "FK_008d9f4e0b30b62b439b092d21a" FOREIGN KEY ("unique_class_id") REFERENCES "unique_class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unique_transfer" ADD CONSTRAINT "FK_09165fa651ab2faa61f64c8891e" FOREIGN KEY ("unique_instance_id") REFERENCES "unique_instance"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unique_instance" ADD CONSTRAINT "FK_afece6c4021225065d4c4112e9c" FOREIGN KEY ("unique_class_id") REFERENCES "unique_class"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unique_instance" ADD CONSTRAINT "FK_aa027c94b1903ff9271fea05e02" FOREIGN KEY ("owner_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "historical_balance" ADD CONSTRAINT "FK_383ff006e4b59db91d32cb891e9" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_balance" ADD CONSTRAINT "FK_55a3340913f4ffe21ffaa0e0510" FOREIGN KEY ("account_id") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "asset_balance" ADD CONSTRAINT "FK_b3bbf183209c65d4306a85a06c4" FOREIGN KEY ("asset_id") REFERENCES "asset"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "asset_balance" DROP CONSTRAINT "FK_b3bbf183209c65d4306a85a06c4"`);
        await queryRunner.query(`ALTER TABLE "asset_balance" DROP CONSTRAINT "FK_55a3340913f4ffe21ffaa0e0510"`);
        await queryRunner.query(`ALTER TABLE "historical_balance" DROP CONSTRAINT "FK_383ff006e4b59db91d32cb891e9"`);
        await queryRunner.query(`ALTER TABLE "unique_instance" DROP CONSTRAINT "FK_aa027c94b1903ff9271fea05e02"`);
        await queryRunner.query(`ALTER TABLE "unique_instance" DROP CONSTRAINT "FK_afece6c4021225065d4c4112e9c"`);
        await queryRunner.query(`ALTER TABLE "unique_transfer" DROP CONSTRAINT "FK_09165fa651ab2faa61f64c8891e"`);
        await queryRunner.query(`ALTER TABLE "unique_transfer" DROP CONSTRAINT "FK_008d9f4e0b30b62b439b092d21a"`);
        await queryRunner.query(`ALTER TABLE "transfer" DROP CONSTRAINT "FK_e818cd083f48ed773afe017f7c0"`);
        await queryRunner.query(`DROP TABLE "asset"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3bbf183209c65d4306a85a06c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_55a3340913f4ffe21ffaa0e051"`);
        await queryRunner.query(`DROP TABLE "asset_balance"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_383ff006e4b59db91d32cb891e"`);
        await queryRunner.query(`DROP TABLE "historical_balance"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa027c94b1903ff9271fea05e0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_afece6c4021225065d4c4112e9"`);
        await queryRunner.query(`DROP TABLE "unique_instance"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09165fa651ab2faa61f64c8891"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_008d9f4e0b30b62b439b092d21"`);
        await queryRunner.query(`DROP TABLE "unique_transfer"`);
        await queryRunner.query(`DROP TABLE "unique_class"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e818cd083f48ed773afe017f7c"`);
        await queryRunner.query(`DROP TABLE "transfer"`);
    }
}
