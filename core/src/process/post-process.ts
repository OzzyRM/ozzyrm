import type { DocSchema } from "../utils/types/types";
import type { OrmDocgenAdapter } from "../utils/adapter";

export function postProcess(schema: DocSchema, adapter: OrmDocgenAdapter): DocSchema {
    /**
     * If NO adapter is defined which resulting in undefined case and falsely state
     * Handles by populateReferencedBy -> get information for referencedBy
     */
    if (!adapter.disabled?.referencedBy) {
        schema = populateReferencedBy(schema);
    }
    /**
     * If NO metadata is defined which resulting in undefined case and falsely state
     * Handles by applyMetadata -> add metadata for "description" field outside  
     */
    if (!adapter.disabled?.descriptions && adapter.metadata) {
        schema = applyMetadata(schema, adapter);
    }

    return schema;
}

/**
 * 
 * @param schema 
 * @returns newest schema
 * Get a field reference for the schema models so referencedBy can be filled
 */
function populateReferencedBy(schema: DocSchema): DocSchema {
    const modelMap = new Map(schema.models.map((m) => [m.name, m]));

    for (const model of schema.models) {
        for (const field of model.fields) {
            if (field.relation) {
                const target = modelMap.get(field.relation.model);
                if (target) {
                    // Check if the function already run twice
                    const alreadyExists = target.referencedBy.some(
                        (r) => r.model === model.name && r.field === field.name
                    );
                    if (!alreadyExists) {
                        target.referencedBy.push({ model: model.name, field: field.name });
                    }
                }
            }
        }
    }

    return schema;
};

/**
 * 
 * @param schema 
 * @param adapter 
 * @returns newest schema
 * Apply metadata for "description" field outside the ORM syntax: addons
 */
function applyMetadata(schema: DocSchema, adapter: OrmDocgenAdapter): DocSchema {
    const { metadata } = adapter;
    
    if (!metadata) {
        return schema;
    }

    return {
        ...schema,
        models: schema.models.map((model) => {
            const modelMeta = metadata.models?.[model.name];
            const fieldsMeta = metadata.fields?.[model.name];

            return {
                ...model,
                description: modelMeta?.description ?? model.description,
                fields: model.fields.map((field) => ({
                    ...field,
                    description: fieldsMeta?.[field.name]?.description ?? field.description
                })),
            };
        }),
    };
};