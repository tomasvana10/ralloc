local groupMembersKey = KEYS[1]
local userGroupKey = KEYS[2]
local groupMetadataKey = KEYS[3]

local compressedUser = ARGV[1]
local groupSize = tonumber(ARGV[2])
local groupName = ARGV[3]
local frozen = tonumber(ARGV[4])

local originalGroupName = redis.call("GET", userGroupKey) or ""

-- check 1. is the group session frozen?
if frozen == 1 then
  return {"failure", "frozen", originalGroupName, originalGroupName}
end

-- check 2. does group exist?
local exists = redis.call("EXISTS", groupMetadataKey)
if exists == 0 then
  return {"failure", "nonexistent", originalGroupName, originalGroupName}
end

-- check 3. is user already allocated to a group?
if originalGroupName ~= "" then
  return {"failure", "alreadyAllocated", originalGroupName, originalGroupName}
end

-- check 4. is group full?
local current = redis.call("SCARD", groupMembersKey)
if current >= groupSize then
  return {"failure", "full", originalGroupName, originalGroupName}
end

-- user can join this group!
redis.call("SADD", groupMembersKey, compressedUser) -- compressedUser is used solely for the groupMembers set
redis.call("SET", userGroupKey, groupName) -- userId (part of userGroupKey) is used here to make lookups for step 2 MUCH easier

return {"success", "", originalGroupName, groupName}
