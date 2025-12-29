local key = KEYS[1]

local now = tonumber(ARGV[1])
local refillsPerSecond = tonumber(ARGV[2])
local burst = tonumber(ARGV[3])
local cost = tonumber(ARGV[4])

local SEP = "|" -- could pass this in but might as well keep it here since
                -- it is only needed within this script
local data = redis.call("GET", key)

local tokens = burst
local last = now

if data then
  local isep = string.find(data, SEP)
  tokens = tonumber(string.sub(data, 1, isep - 1))
  last = tonumber(string.sub(data, isep + 1))

  local delta = now - last
  if delta > 0 then
    -- add tokens, capped at maximum burst
    tokens = math.min(burst, tokens + delta * refillsPerSecond)
  end
end

local allowed = 0

-- client has enough tokens
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end

-- calculate reset time (when at least 1 token will be available)
local reset = now
if tokens < 1 then
  local tokensNeeded = 1 - tokens
  local secondsUntilToken = math.ceil(tokensNeeded / refillsPerSecond)
  reset = now + secondsUntilToken
end

local ttl = math.ceil(burst / refillsPerSecond) * 2
-- update bucket with ttl
redis.call("SET", key, tokens .. SEP .. now, "EX", ttl)

return { allowed, tokens, burst, reset }