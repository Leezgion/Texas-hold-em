/**
 * 简单测试验证Jest框架
 */

describe('简单测试', () => {
    test('基本功能测试', () => {
        expect(1 + 1).toBe(2);
        expect('hello').toBe('hello');
        expect([1, 2, 3]).toContain(2);
    });

    test('异步测试', async () => {
        const promise = Promise.resolve('success');
        await expect(promise).resolves.toBe('success');
    });

    test('对象测试', () => {
        const obj = { name: 'test', value: 123 };
        expect(obj).toEqual({ name: 'test', value: 123 });
        expect(obj).toHaveProperty('name');
    });
});
