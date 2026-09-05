const assert = require('node:assert/strict');
const test = require('node:test');

const prismaPath = require.resolve('../src/lib/prisma');
const servicePath = require.resolve('../src/services/gym.service');

const loadService = (gymOverrides = {}) => {
    const gym = {
        create: async (query) => query,
        findFirst: async () => ({ id: 'gym-1' }),
        update: async (query) => query,
        ...gymOverrides
    };

    require.cache[prismaPath] = {
        id: prismaPath,
        filename: prismaPath,
        loaded: true,
        exports: { gym }
    };
    delete require.cache[servicePath];

    return require(servicePath);
};

const validGym = {
    name: '  Fit Hub  ',
    address: '  Main Road  ',
    city: ' Kharar ',
    state: ' Punjab ',
    pincode: ' 140301 ',
    phone: ' 9999999999 ',
    email: ' OWNER@EXAMPLE.COM ',
    description: ' Strength and cardio ',
    latitude: '30.7421',
    longitude: 76.6471
};

test('createGym only sends normalized, owner-editable fields to Prisma', async () => {
    let receivedQuery;
    const service = loadService({
        create: async (query) => {
            receivedQuery = query;
            return { id: 'gym-1' };
        }
    });

    await service.createGym({
        ...validGym,
        status: 'APPROVED',
        ownerId: 'attacker-owner',
        owner: { connect: { id: 'attacker-owner' } },
        plans: { create: [{ name: 'Injected plan' }] },
        images: { create: [{ url: 'https://example.com/injected' }] }
    }, 'authenticated-owner');

    assert.deepEqual(receivedQuery.data, {
        name: 'Fit Hub',
        address: 'Main Road',
        city: 'Kharar',
        state: 'Punjab',
        pincode: '140301',
        phone: '9999999999',
        email: 'owner@example.com',
        description: 'Strength and cardio',
        latitude: 30.7421,
        longitude: 76.6471,
        ownerId: 'authenticated-owner'
    });
});

test('coordinates must be supplied together and stay in geographic ranges', async () => {
    const service = loadService();

    await assert.rejects(
        service.createGym({ ...validGym, longitude: undefined }, 'owner-1'),
        /Latitude and longitude must be provided together/
    );

    await assert.rejects(
        service.createGym({ ...validGym, latitude: 91 }, 'owner-1'),
        /Latitude must be between -90 and 90/
    );

    await assert.rejects(
        service.createGym({ ...validGym, longitude: -181 }, 'owner-1'),
        /Longitude must be between -180 and 180/
    );
});

test('an owner can clear both saved coordinates without changing protected fields', async () => {
    let receivedQuery;
    const service = loadService({
        update: async (query) => {
            receivedQuery = query;
            return { id: 'gym-1' };
        }
    });

    await service.updateGymByOwner('gym-1', 'owner-1', {
        ...validGym,
        latitude: '',
        longitude: null,
        status: 'APPROVED'
    });

    assert.equal(receivedQuery.data.latitude, null);
    assert.equal(receivedQuery.data.longitude, null);
    assert.equal('status' in receivedQuery.data, false);
    assert.equal('ownerId' in receivedQuery.data, false);
});

test('an approved gym is not sent back for review when an edit omits unchanged coordinates', async () => {
    let receivedQuery;
    const service = loadService({
        findFirst: async () => ({
            id: 'gym-1',
            status: 'APPROVED',
            name: 'Fit Hub',
            address: 'Main Road',
            city: 'Kharar',
            state: 'Punjab',
            pincode: '140301',
            latitude: 30.7421,
            longitude: 76.6471
        }),
        update: async (query) => {
            receivedQuery = query;
            return { id: 'gym-1', status: 'APPROVED' };
        }
    });

    const { latitude: _latitude, longitude: _longitude, ...withoutCoordinates } = validGym;
    await service.updateGymByOwner('gym-1', 'owner-1', withoutCoordinates);

    assert.equal(receivedQuery.data.status, undefined);
    assert.equal('latitude' in receivedQuery.data, false);
    assert.equal('longitude' in receivedQuery.data, false);
});

test('required fields and email are validated before a database write', async () => {
    let createCalls = 0;
    const service = loadService({
        create: async () => {
            createCalls += 1;
        }
    });

    await assert.rejects(
        service.createGym({ ...validGym, name: '   ' }, 'owner-1'),
        /Name, address, city, state, pincode, and phone are required/
    );
    await assert.rejects(
        service.createGym({ ...validGym, email: 'not-an-email' }, 'owner-1'),
        /valid gym email address/
    );
    assert.equal(createCalls, 0);
});
