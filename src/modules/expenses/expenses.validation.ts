import { z } from 'zod'
import { generalRules } from '../../common/utils/generalRules'
export const createExpenseSchema = {
    body: z.object({
        title: z.string().min(3),
        amount: z.number().min(0),
        category: z.string().min(2),
        expenseDate: z.coerce.date().optional(),
        note: z.string().optional()
    })

}

export const getExpenseByIdSchema = {
    params: z.object({
        id: generalRules.id
    })
}


export const updateExpenseSchema = {
    params: z.object({
        id: generalRules.id
    }),
    // body: createSupplierSchema.body.safeExtend({}).optional()
    body: z.object({
        title: z.string().min(3).optional(),
        amount: z.number().min(0).optional(),
        category: z.string().min(2).optional(),
        expenseDate: z.coerce.date().optional(),
        note: z.string().optional()
    })
}