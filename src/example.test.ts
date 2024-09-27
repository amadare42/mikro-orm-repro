import { Entity, ManyToOne, MikroORM, PrimaryKey, Property } from '@mikro-orm/sqlite';
import { SoftDelete } from './softDelete';

@Entity()
@SoftDelete()
class User {
    @PrimaryKey()
    id!: number;

    @Property()
    name!: string;

    @Property({ unique: true })
    email!: string;

    @Property()
    deletedAt: Date | null = null;
}

@Entity()
class UserBlock {
    @PrimaryKey()
    id!: number;

    @ManyToOne()
    user!: User;

    @ManyToOne()
    target!: User;
}

let orm: MikroORM;

beforeAll(async () => {
    orm = await MikroORM.init({
        dbName: ':memory:',
        entities: [User, UserBlock],
        debug: ['query', 'query-params'],
        allowGlobalContext: true, // only for testing
    });
    await orm.schema.refreshDatabase();
});

async function setupFixture() {
    const deletedUser = orm.em.create(User, { name: 'Deleted User', email: 'deletedUser@example.com', deletedAt: new Date() });
    const activeUser = orm.em.create(User, { name: 'Active User', email: 'activeUser@example.com' });
    orm.em.create(UserBlock, { user: activeUser, target: deletedUser });
    await orm.em.flush();
    orm.em.clear();

    return { activeUser, deletedUser };

}

afterAll(async () => {
    await orm.close(true);
});

test('fetching whole entity', async () => {
    const { activeUser } = await setupFixture();

    const result = await orm.em.find(UserBlock, {
        user: activeUser.id,
    })

    // No entities returned here because inner join was used while soft-deleted user was filtered out
    expect(result).toHaveLength(0);
});

test('fetching specific field', async () => {
    const { activeUser } = await setupFixture();

    const result = await orm.em.find(UserBlock, {
        user: activeUser.id,
    }, {
        fields: ['target.id']
    })

    // Here entity is returned unexpectedly because left join was used so soft-deleted "target" is set to null
    expect(result).toHaveLength(0);
})