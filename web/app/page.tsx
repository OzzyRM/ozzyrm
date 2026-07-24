"use client";

import { OzzyRMDocs } from "@ozzyrm/react";
import { defaultSchemaId, schemaCatalog } from "@/lib/schema/schema.retrieve";

export default function Home() {
    return (
        <OzzyRMDocs
            catalog={schemaCatalog}
            defaultSchemaId={defaultSchemaId}
            basePath="/"
            logoSrc="/logo.svg"
        />
    );
}
