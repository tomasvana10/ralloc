local userGroupKey = KEYS[1]

local userIdSearchPrefix = ARGV[1]
local groupMembersKeyTemplate = ARGV[2]

-- check 1. is user assigned to a group?
local groupName = redis.call("GET", userGroupKey)
if not groupName then
  return {"failure", "notInGroup"}
end

-- construct the key to find the group members using the template
local groupMembersKey = string.gsub(groupMembersKeyTemplate, "<groupName>", groupName)


local members = redis.call("SMEMBERS", groupMembersKey)
local toRemove = nil

-- kind of a repeat implementation of UserRepresentation.is() but it must be done for atomicity
local userIdSearchPrefixLength = #userIdSearchPrefix
for _, member in ipairs(members) do
  -- locate the matching user
  if string.sub(member, 1, userIdSearchPrefixLength) == userIdSearchPrefix then
    toRemove = member
    break
  end
end

redis.call("SREM", groupMembersKey, toRemove)
redis.call("DEL", userGroupKey)
return {"success", groupName}

