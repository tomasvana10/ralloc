local groupMembersKey = KEYS[1]
local userGroupKey = KEYS[2]
local groupMetadataKey = KEYS[3]

local userRepresentation = ARGV[1]
local groupSize = tonumber(ARGV[2])
local groupName = ARGV[3]

-- check 1. does group exist?
local exists = redis.call("EXISTS", groupMetadataKey)
if exists == 0 then
  return {"failure", "nonexistent"}
end

-- check 2. is user already allocated to a group?
local existing = redis.call("GET", userGroupKey)
if existing then
  return {"failure", "alreadyAllocated"}
end

-- check 3. is group full?
local current = redis.call("SCARD", groupMembersKey)
if current >= groupSize then
  return {"failure", "full"}
end

-- user can join this group!
redis.call("SADD", groupMembersKey, userRepresentation) -- userRepresentation is used solely for the groupMembers set
redis.call("SET", userGroupKey, groupName) -- userId (part of userGroupKey) is used here to make lookups for step 1 MUCH easier

return {"success", ""}
