import { SchemaDocs } from "@/app/components/schema-docs";
import { defaultSchemaId, schemaCatalog } from "@/lib/schema/schema.retrieve";

export default function Home() {
    return (
        <SchemaDocs
            catalog={schemaCatalog}
            defaultSchemaId={defaultSchemaId}
        />
    );
}
