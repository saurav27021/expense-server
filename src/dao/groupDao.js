const Group = require('../model/group');
const groupDao = {
    createGroup: async (data) => {
        const newGroup = new Group(data);
        return await newGroup.save();
    },

    updateGroup: async (groupId, data) => {

        const { name, description, thumbnail, adminEmail, paymentStatus } = data;
        return await Group.findByIdAndUpdate(groupId, {
            name, description, thumbnail, adminEmail, paymentStatus,

        }, { new: true });
    },

    addMembers: async (groupId, ...membersEmails) => {
        return await Group.findByIdAndUpdate(groupId, {
            $addToSet: { membersEmail: { $each: membersEmails } }
        }, { new: true });
    },


    removeMembers: async (groupId, ...membersEmail) => {
        return await Group.findByIdAndUpdate(
            groupId,
            {
                $pull: {
                    membersEmail: { $in: membersEmail }
                }
            },
            { new: true }
        );




    },
    getGroupByEmail: async (email) => {
        return await Group.find({ membersEmail: email });

    },
    getGroupsForViewer: async (userEmail, adminEmail) => {
        return await Group.find({
            $or: [
                { membersEmail: userEmail },
                { adminEmail: adminEmail }
            ]
        });
    },
    getGroupByStatus: async (status) => {
        return await Group.find({ 'paymentStatus.isPaid': status });
    },

    getGroupById: async (groupId) => {
        return await Group.findById(groupId);
    },
    getAuditLog: async (groupId) => {
        const group = await Group.findById(groupId).select('createdAt updatedAt');
        return {
            createdAt: group.createdAt,
            lastUpdatedAt: group.updatedAt
        };
    },

    getGroupsPaginated: async (email, limit, skip, sortOptions = { createdAt: -1 }) => {
        const [groups, totalCount] = await Promise.all([
            Group.find({ membersEmail: email })
                .sort(sortOptions)
                .skip(skip)
                .limit(limit),
            Group.countDocuments({ membersEmail: email })
        ]);

        return { groups, totalCount };
    }
};


/**
 *We'll only return when was the last time group
 * was settled to begin with,
 * In future, we can move this to separate entity!
 * @param {*} group
 */



module.exports = groupDao;