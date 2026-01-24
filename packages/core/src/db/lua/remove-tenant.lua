local tenantsKey = KEYS[1]
local ttl = tonumber(ARGV[1])

local tenants = redis.call("DECR", tenantsKey)
if tenants <= 0 then
  -- room is empty
  redis.call("DEL", tenantsKey)
  return 0
else
  redis.call("EXPIRE", tenantsKey, ttl)
  return tenants
end