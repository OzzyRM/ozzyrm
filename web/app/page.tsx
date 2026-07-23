import { SchemaDocs } from "@/app/components/schema-docs";
import { retrieveSchema } from "@/lib/schema/schema.retrieve";

export default async function Home() {
    const schema = await retrieveSchema();
    return <SchemaDocs schema={schema} />;
}
