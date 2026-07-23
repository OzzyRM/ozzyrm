import { SchemaDocs } from "@/app/components/schema-docs";
import { retrieveSchema } from "@/lib/schema/schema.retrieve";

export default function Home() {
    const schema = retrieveSchema();
    return <SchemaDocs schema={schema} />;
}
